// Cloudinary unsigned upload utility
// Replace 'your_cloud_name' and 'your_upload_preset' with your Cloudinary values

export async function uploadToCloudinary(file: File): Promise<string> {
    const url = "https://api.cloudinary.com/v1_1/dlcyuweib/image/upload";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "poster_templates"); // Set up unsigned preset in Cloudinary dashboard

    const response = await fetch(url, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        throw new Error("Image upload failed");
    }

    const data = await response.json();
    return data.secure_url; // Public image URL
}
