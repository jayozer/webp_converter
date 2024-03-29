import streamlit as st
from webp_converter_app import webp_converter
from compress_video_app import compress_video

#In this script, PAGES is a dictionary that maps page names to their corresponding functions.

PAGES = {
    "Convert to WEBP": webp_converter,
    "Compress MP4": compress_video
}

#The main function creates a sidebar with a radio button for each page, and calls the function corresponding to the selected page.
def main():
    st.sidebar.title('Navigation')
    selection = st.sidebar.radio("SELECT", list(PAGES.keys()))
    page_function = PAGES[selection]
    page_function()

if __name__ == "__main__":
    main()