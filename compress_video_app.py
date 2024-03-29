import os
import io
import base64
import pandas as pd
from moviepy.editor import VideoFileClip
import streamlit as st
import tempfile

def compress_video():
    """
    The main function of the Instant Video Compressor app.

    This function displays a web application that allows users to compress MP4 video files.
    Users can upload a video file, choose the desired quality, and download the compressed version.

    Parameters:
        None

    Returns:
        None
    """
    st.title('Instant Video Compressor')
    st.write('This app allows you to compress MP4 video files instantly.') 
    st.write('Upload a video file and download the compressed version with a single click.')

    # Quality radio buttons
    quality = st.radio(
        'Quality',
        options=[300, 750, 1000, 2000, 3000, 6000],
        format_func=lambda x: {300: 'Low', 750: 'Low-Med', 1000: 'Medium', 2000: 'Med-High', 3000: 'High', 6000: 'Very High'}.get(x)
    )

    # File uploader
    uploaded_file = st.file_uploader("Choose a video file", type=['mp4'])

    if uploaded_file is not None:
        # Create a temporary file
        tfile = tempfile.NamedTemporaryFile(delete=False) 
        tfile.write(uploaded_file.read())

        # Create a VideoFileClip from the temporary file
        clip = VideoFileClip(tfile.name)

        # Create a temporary file for the output with .mp4 extension
        output_tempfile = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")  

        # Convert and save the video in MP4 format with the specified quality
        clip.write_videofile(output_tempfile.name, codec='libx264', bitrate=str(quality) + 'k')

        # Read the output file into a BytesIO object
        byte_stream = io.BytesIO()
        with open(output_tempfile.name, 'rb') as f:
            byte_stream.write(f.read())
        byte_stream.seek(0)
        b64 = base64.b64encode(byte_stream.getvalue()).decode()

        # Create a download link for the compressed video
        href = f'<a href="data:file/mp4;base64,{b64}" download="output.mp4">Download compressed video</a>'
        st.markdown(href, unsafe_allow_html=True)
