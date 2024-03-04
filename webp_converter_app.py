import os
import io
import base64
import pandas as pd
from PIL import Image
import streamlit as st

def main():
    st.title('Instant WEBP Converter')
    st.write('This app allows you to convert image files (PNG, JPG, JPEG) to WEBP format instantly.') 
    st.write('Upload multiple files and download cpnverted ones you want with a single click.')
    #description
    st.write('**What is WEBP and why use it?**')
    st.write('WEBP is a modern image format that provides superior lossless and lossy compression for images on the web. Using WebP, webmasters and web developers can create smaller, richer images that make the web faster.')


    # Multiple file uploader
    uploaded_files = st.file_uploader("Choose image files", accept_multiple_files=True, type=['png', 'jpg', 'jpeg'])

    file_details = {"FileName":[], "OriginalFileSize":[], "ConvertedFileName":[], "ConvertedFileSize":[], "File":[]}

    for uploaded_file in uploaded_files:
        # Get file details
        file_details["FileName"].append(uploaded_file.name)
        file_details["OriginalFileSize"].append(uploaded_file.size)

        # Convert and save the image in WEBP format
        with Image.open(uploaded_file) as image:
            byte_stream = io.BytesIO()
            image.save(byte_stream, format='WEBP')
            byte_stream.seek(0)
            b64 = base64.b64encode(byte_stream.getvalue()).decode()
            file_details["File"].append(b64)
            file_details["ConvertedFileName"].append(os.path.splitext(uploaded_file.name)[0] + '.webp')
            file_details["ConvertedFileSize"].append(len(byte_stream.getvalue()))

    # Convert the dictionary to a pandas DataFrame
    df = pd.DataFrame(file_details)

    # Calculate the total sizes of the original and converted files
    total_original_size = df["OriginalFileSize"].sum()
    total_converted_size = df["ConvertedFileSize"].sum()

    # Create a new DataFrame for the totals and concatenate it with the original DataFrame
    df_totals = pd.DataFrame({"FileName": ["Total"], "OriginalFileSize": [total_original_size], "ConvertedFileName": [""], "ConvertedFileSize": [total_converted_size], "File": [""]})
    df = pd.concat([df, df_totals], ignore_index=True)

    st.dataframe(df)

    if st.button('Download All'):
        for i in range(len(df) - 1):  # Exclude the last row (totals)
            b64 = df["File"][i]
            filename = df["ConvertedFileName"][i]
            href = f'<a href="data:file/webp;base64,{b64}" download="{filename}">Download {filename}</a>'
            st.markdown(href, unsafe_allow_html=True)

if __name__ == '__main__':
    main()