import html
from modules import script_callbacks, shared, scripts
import gradio as gr
from pathlib import Path
import os
import sys
import platform

def add_tab():
    with gr.Blocks(analytics_enabled=False) as ui:
        #refresh = gr.Button(value="refresh", variant="primary")
        canvas = gr.HTML(f"<iframe src=\"file/" + usefulDirs[0] + "/" + usefulDirs[1] + "/app/index.html\" style=\"height:1024px;width:100%;\"></iframe>")
        # refresh.click(
            
        # )


    return [(ui, "openOutpaint", "openOutpaint")]

usefulDirs = scripts.basedir().split(os.sep)[-2:]
print("openOutpaint init")
script_callbacks.on_ui_tabs(add_tab)