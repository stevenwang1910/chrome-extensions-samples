from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    img = Image.new('RGBA', (size, size), (102, 126, 234, 255))
    draw = ImageDraw.Draw(img)
    
    # Create gradient effect (simplified)
    for y in range(size):
        r = int(102 + (118 - 102) * y / size)
        g = int(126 + (75 - 126) * y / size)
        b = int(234 + (162 - 234) * y / size)
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))
    
    # Draw rounded rectangle
    radius = int(size * 0.15)
    draw.rounded_rectangle(
        [(0, 0), (size, size)],
        radius=radius,
        fill=(102, 126, 234, 255)
    )
    
    # Draw "AI" text
    font_size = int(size * 0.5)
    try:
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    text = "AI"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (size - text_width) // 2
    y = int(size * 0.55) - text_height // 2
    
    draw.text((x, y), text, font=font, fill=(255, 255, 255, 255))
    
    # Draw wave line
    wave_y = int(size * 0.75)
    wave_start_x = int(size * 0.25)
    wave_end_x = int(size * 0.75)
    
    points = []
    for i in range(10):
        x = wave_start_x + (wave_end_x - wave_start_x) * i / 9
        y = wave_y + int(size * 0.05) * (1 if i % 2 == 0 else -1)
        points.append((x, y))
    
    for i in range(len(points) - 1):
        draw.line([points[i], points[i + 1]], fill=(255, 255, 255, 255), width=max(1, int(size * 0.03)))
    
    # Save as PNG
    img.save(filename, 'PNG')
    print(f"Created {filename}")

# Create icons
os.makedirs('ai-news-summarizer', exist_ok=True)

create_icon(16, 'ai-news-summarizer/icon16.png')
create_icon(48, 'ai-news-summarizer/icon48.png')
create_icon(128, 'ai-news-summarizer/icon128.png')

print("All icons created successfully!")