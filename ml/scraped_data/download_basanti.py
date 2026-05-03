import requests
import os
from urllib.parse import urljoin

base_url = "https://www.basantijewellers.com/catalogue"
domain = "https://www.basantijewellers.com"
image_paths = [
    "/images/2021/05/19/x1.jpg", "/images/2021/05/19/x10.jpg", "/images/2021/05/19/x11.jpg",
    "/images/2021/05/19/x2.jpg", "/images/2021/05/19/x3.jpg", "/images/2021/05/19/x4.jpg",
    "/images/2021/05/19/x5.jpg", "/images/2021/05/19/x61.jpg", "/images/2021/05/19/x7.jpg",
    "/images/2021/05/19/x8.jpg", "/images/2021/05/19/x9.jpg", "/images/2021/06/14/2.jpg",
    "/images/2021/06/14/3.jpg", "/images/2021/06/14/4.jpg", "/images/2021/06/14/5.jpg",
    "/images/2021/06/14/6.jpg", "/images/2021/06/14/7.jpg", "/images/2021/06/14/dfsdfssfs.jpg",
    "/images/ver1.png"
]

output_dir = "ml/scraped_data/basanti"
os.makedirs(output_dir, exist_ok=True)

for path in image_paths:
    full_url = urljoin(domain, path)
    filename = os.path.basename(path)
    try:
        response = requests.get(full_url, timeout=10)
        if response.status_code == 200:
            with open(os.path.join(output_dir, filename), "wb") as f:
                f.write(response.content)
            print(f"Downloaded {filename}")
    except Exception as e:
        print(f"Failed to download {full_url}: {e}")
