"use client";
import React, { useEffect, useRef } from "react";
import EditorJS, { OutputData, API } from "@editorjs/editorjs";
// @ts-ignore
import Header from "@editorjs/header";
// @ts-ignore
import List from "@editorjs/list";
// @ts-ignore
import Quote from "@editorjs/quote";
// @ts-ignore
import Paragraph from "@editorjs/paragraph";
// @ts-ignore
import Delimiter from "@editorjs/delimiter";

/**
 * Custom Alignment Tool for Editor.js
 * Purely visual, modifies data-alignment on current block
 */
class AlignmentTool {
  private api: API;
  private buttons: { name: string; icon: string; title: string }[];

  constructor({ api }: { api: API }) {
    this.api = api;
    this.buttons = [
      { name: "left", icon: "⬅️", title: "Align Left" },
      { name: "center", icon: "↔️", title: "Align Center" },
      { name: "right", icon: "➡️", title: "Align Right" },
    ];
  }

  render() {
    const wrapper = document.createElement("div");
    wrapper.classList.add("cdx-inline-toolbar-group");

    this.buttons.forEach(({ name, icon, title }) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.innerHTML = icon;
      btn.title = title;
      btn.className =
        "px-1 text-sm hover:bg-gray-100 rounded transition-colors duration-100";
      btn.addEventListener("click", () => this.setAlignment(name as 'left' | 'center' | 'right'));
      wrapper.appendChild(btn);
    });

    return wrapper;
  }

  setAlignment(direction: 'left' | 'center' | 'right') {
    const blockIndex = this.api.blocks.getCurrentBlockIndex();
    const currentBlock = this.api.blocks.getBlockByIndex(blockIndex);
    if (!currentBlock) return;

    const holder = currentBlock.holder as HTMLElement;
    holder.dataset.alignment = direction;
  }

  surround() {}
}

interface EditorProps {
  data?: OutputData;
  onChange?: (data: OutputData) => void;
}

const Editor: React.FC<EditorProps> = ({ data, onChange }) => {
  const editorRef = useRef<EditorJS | null>(null);

  useEffect(() => {
    if (!editorRef.current) {
      const editor = new EditorJS({
        holder: "editorjs",
        autofocus: true,
        tools: {
          header: {
            class: Header,
            inlineToolbar: ["link", "bold", "italic", "alignment"],
            config: {
              levels: [1, 2, 3],
              defaultLevel: 2,
              placeholder: "Type heading...",
            },
          },
          paragraph: {
            class: Paragraph,
            inlineToolbar: ["link", "bold", "italic", "alignment"],
          },
          list: {
            class: List,
            inlineToolbar: true,
          },
          quote: {
            class: Quote,
            inlineToolbar: true,
          },
          delimiter: Delimiter,
          alignment: AlignmentTool, // register our custom tool
        },
        data: data || {},
        onChange: async () => {
          const content = await editor.saver.save();
          onChange && onChange(content);
        },
      });

      editorRef.current = editor;
    }

    return () => {
      if (editorRef.current && editorRef.current.destroy) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full border rounded-md p-4 bg-white">
      <div
        id="editorjs"
        className="
          text-gray-800 leading-snug
          [&_.ce-block]:my-2
          [&_.ce-header]:font-semibold
          [&_.ce-header[data-level='1']]:text-2xl
          [&_.ce-header[data-level='2']]:text-xl
          [&_.ce-header[data-level='3']]:text-lg
          [&_.ce-paragraph]:text-base
          [&_.ce-paragraph]:leading-tight
          [&_.ce-quote]:border-l-4
          [&_.ce-quote]:border-gray-300
          [&_.ce-quote]:pl-3
          [&_.ce-quote]:italic
          [&_.ce-delimiter]:flex
          [&_.ce-delimiter]:justify-center
          [&_.ce-delimiter]:text-gray-400
          [&_.ce-delimiter]:before:content-['•••']
          [&_[data-alignment='left']]:text-left
          [&_[data-alignment='center']]:text-center
          [&_[data-alignment='right']]:text-right
        "
      />
    </div>
  );
}

export default Editor;