import torch
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
import os
from sklearn.cluster import KMeans
import numpy as np
import shutil

def label_images(image_dirs, output_base, num_clusters=5):
    # Load pre-trained ResNet
    model = models.resnet50(pretrained=True)
    model.eval()
    # Remove last layer to get embeddings
    embedding_model = torch.nn.Sequential(*(list(model.children())[:-1]))
    
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])
    
    embeddings = []
    image_paths = []
    
    for image_dir in image_dirs:
        for root, _, files in os.walk(image_dir):
            for file in files:
                if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                    path = os.path.join(root, file)
                    try:
                        img = Image.open(path).convert('RGB')
                        img_t = transform(img).unsqueeze(0)
                        with torch.no_grad():
                            emb = embedding_model(img_t).squeeze().numpy()
                        embeddings.append(emb)
                        image_paths.append(path)
                    except Exception as e:
                        print(f"Skipping {path}: {e}")
    
    if not embeddings:
        print("No images found for labeling.")
        return
        
    embeddings = np.array(embeddings)
    kmeans = KMeans(n_clusters=num_clusters, random_state=42)
    labels = kmeans.fit_predict(embeddings)
    
    for i, label in enumerate(labels):
        cluster_dir = os.path.join(output_base, f"category_{label}")
        os.makedirs(cluster_dir, exist_ok=True)
        shutil.copy(image_paths[i], os.path.join(cluster_dir, os.path.basename(image_paths[i])))
        
    print(f"Labeled {len(image_paths)} images into {num_clusters} categories in {output_base}")

if __name__ == "__main__":
    dirs = [
        "ml/scraped_data/tanishq/tamil_nadu_images",
        "ml/scraped_data/tanishq/bengal_images",
        "ml/scraped_data/basanti"
    ]
    label_images(dirs, "ml/scraped_data/labeled", num_clusters=6)
