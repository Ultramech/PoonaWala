import fitz  # PyMuPDF
import os
from PIL import Image
import io

def extract_images_from_pdf(pdf_path, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    pdf_file = fitz.open(pdf_path)
    img_count = 0
    
    for page_index in range(len(pdf_file)):
        page = pdf_file[page_index]
        image_list = page.get_images(full=True)
        
        for img_index, img in enumerate(image_list):
            xref = img[0]
            base_image = pdf_file.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"]
            
            # Load with PIL to filter by size (avoid icons/tiny logos)
            image = Image.open(io.BytesIO(image_bytes))
            if image.width < 200 or image.height < 200:
                continue
                
            img_count += 1
            image_filename = f"image_p{page_index+1}_{img_index+1}.{image_ext}"
            image.save(os.path.join(output_dir, image_filename))
            
    print(f"Extracted {img_count} images from {pdf_path} to {output_dir}")

if __name__ == "__main__":
    extract_images_from_pdf("ml/data/scraped_data/tanishq/tamil_nadu.pdf", "ml/data/scraped_data/tanishq/tamil_nadu_images")
    extract_images_from_pdf("ml/data/scraped_data/tanishq/bengal.pdf", "ml/data/scraped_data/tanishq/bengal_images")
