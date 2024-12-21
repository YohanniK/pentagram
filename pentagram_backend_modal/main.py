import io
import random
import time
from pathlib import Path

import modal

MINUTES = 60

app = modal.App("Pentagram")

image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install(
        "accelerate",
        "diffusers",
        "fastapi[standard]",
        "huggingface-hub[hf-transfer]",
        "sentencepiece",
        "torch",
        "torchvision",
        "transformers",
    ).env({"HF_HUB_ENABLE_HF_TRANSFER": "1"})
)

with image.imports():
    import diffusers
    import torch
    from fastapi import Response

model_id = "adamo1139/stable-diffusion-3.5-large-turbo-ungated"
model_revision_id = "9ad870ac0b0e5e48ced156bb02f85d324b7275d2"

@app.cls(image=image,gpu="A10G",timeout=10*MINUTES,)
class Pentagram:
    @modal.build()
    @modal.enter()
    def initialize(self):
        self.pipe = diffusers.StableDiffusion3Pipeline.from_pretrained(
            model_id,
            revision=model_revision_id,
            torch_dtype=torch.bfloat16,
        )

    @modal.enter()
    def move_to_gpu(self):
        self.pipe.to("cuda")

    @modal.method()
    def run(self, prompt: str, batch_size: int = 4, seed: int = random.randint(0, 2**32 - 1)) -> list[bytes]:
        print(f"Running with prompt: {prompt}")
        print(f"Batch size: {batch_size}")
        print(f"Seed: {seed}")

        images = self.pipe(
            prompt,
            num_images_per_prompt=batch_size,
            num_inference_steps=4,
            guidance_scale=0.0,
            max_sequence_length=256, # TODO: change this to 512
        ).images

        image_output = []
        for image in images:
            with io.BytesIO() as buffer:
                image.save(buffer, format="png")
                image_output.append(buffer.getvalue())
        torch.cuda.empty_cache()
        return image_output

    @modal.web_endpoint(docs=True)
    def web(self, prompt: str, seed: int):
        return Response(
            content=self.run.local(prompt, batch_size=1, seed=seed)[0],
            media_type="image/png",
        )

@app.local_entrypoint()
def entrypoint(
    samples: int = 4,
    prompt: str = "A medieval knight riding a horse",
    batch_size: int = 4,
    seed: int = random.randint(0, 2**32 - 1),
):
    print(
        f"prompt => {prompt}",
        f"samples => {samples}",
        f"batch_size => {batch_size}",
        f"seed => {seed}",
    )

    output_dir = Path("/tmp/stable-diffusion")
    output_dir.mkdir(exist_ok=True, parents=True)

    inference_service = Pentagram()

    for sample_idx in range(samples):
        start = time.time()
        images = inference_service.run.remote(prompt, batch_size, seed)
        duration = time.time() - start
        print(f"sample {sample_idx+1} took {duration:.3f} seconds")
        if sample_idx:
            print(
                f"\tGenerated {len(images)} images in {duration:.3f} seconds / images",
            )
        for batch_idx, image_bytes in enumerate(images):
            output_path = (
                output_dir
                / f"output_{slugify(prompt)[:64]}_{str(sample_idx).zfill(2)}_{str(batch_idx).zfill(2)}.png"
            )
            if not batch_idx:
                print("Saving outputs", end="\n\t")
            print(
                output_path,
                end="\n" + ("\t" if batch_idx < len(images) - 1 else ""),
            )
            output_path.write_bytes(image_bytes)
