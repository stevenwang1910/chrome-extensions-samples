import os
from PIL import Image, ImageDraw, ImageFont

icons_dir = "icons"
os.makedirs(icons_dir, exist_ok=True)

def create_icon(size, filename):
    img = Image.new('RGB', (size, size), color=(3, 102, 214))
    draw = ImageDraw.Draw(img)
    
    white_square_size = size // 3
    white_square_x = (size - white_square_size) // 2
    white_square_y = (size - white_square_size) // 2
    draw.rectangle(
        [white_square_x, white_square_y, white_square_x + white_square_size, white_square_y + white_square_size],
        fill="white"
    )
    
    text = "#"
    try:
        font = ImageFont.truetype("arial.ttf", size // 2)
    except:
        font = ImageFont.load_default()
    
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    text_x = (size - text_width) // 2
    text_y = (size - text_height) // 2 - 5
    
    draw.text((text_x, text_y), text, fill="black", font=font)
    
    img.save(os.path.join(icons_dir, filename))

create_icon(16, "icon16.png")
create_icon(48, "icon48.png")
create_icon(128, "icon128.png")

print(f"Icons created successfully in {icons_dir}")
