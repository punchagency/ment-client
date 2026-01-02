import { type FC, useState, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import {
  FaBold, FaItalic, FaUnderline, FaLink, FaUndo, FaRedo,
  FaListUl, FaListOl, FaImage, FaCode
} from "react-icons/fa";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const RichTextEditor: FC<RichTextEditorProps> = ({ value, onChange }) => {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: true }),
      Image.configure({ inline: false, allowBase64: true }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return <div className="text-gray-400">Loading editor...</div>;

  const handleAddLink = () => {
    if (!linkUrl) return;

    const selectedText = editor.state.doc.textBetween(
        editor.state.selection.from,
        editor.state.selection.to
    );

    if (!selectedText) {
        editor.chain().focus()
        .insertContent(`<a href="${linkUrl}" target="_blank">${linkUrl}</a>`)
        .run();
    } else {
        editor.chain().focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl, target: "_blank" })
        .run();
    }

    setLinkUrl("");
    setShowLinkInput(false);
    };



  const addImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      editor.chain().focus().setImage({ src }).run();
    };
    reader.readAsDataURL(file);
    e.target.value = ""; 
  };

  interface ToolbarButtonProps {
    icon: React.ElementType;
    active?: boolean;
    onClick: () => void;
  }

  const ToolbarButton: FC<ToolbarButtonProps> = ({ icon: Icon, onClick, active }) => (
    <button
      onClick={onClick}
      type="button"
      className={`px-2 py-1 rounded transition ${active ? "bg-gray-700" : "bg-gray-800"} hover:bg-gray-700 border border-gray-600`}
    >
      <Icon size={14} />
    </button>
  );

  return (
    <div className="bg-[#1e1e1e] text-white rounded-lg p-4 border border-gray-700 shadow-lg w-full">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex gap-2 mb-3 flex-wrap bg-[#252525] p-2 rounded items-center">
        <ToolbarButton icon={FaBold} onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} />
        <ToolbarButton icon={FaItalic} onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} />
        <ToolbarButton icon={FaUnderline} onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} />
        <ToolbarButton icon={FaListUl} onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} />
        <ToolbarButton icon={FaListOl} onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} />
        <ToolbarButton icon={FaCode} onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} />
        <ToolbarButton icon={FaUndo} onClick={() => editor.commands.undo()} />
        <ToolbarButton icon={FaRedo} onClick={() => editor.commands.redo()} />

        <ToolbarButton icon={FaLink} onClick={() => setShowLinkInput(!showLinkInput)} />
    
        <ToolbarButton icon={FaImage} onClick={addImage} />
      </div>


      {showLinkInput && (
        <div className="flex gap-1 items-center mb-3">
          <input
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Enter link URL"
            className="px-2 py-1 rounded bg-gray-800 border border-gray-600 text-white w-60"
          />
          <button onClick={handleAddLink} className="px-2 py-1 bg-blue-600 rounded hover:bg-blue-500 text-white">
            Add
          </button>
        </div>
      )}

      <EditorContent
        editor={editor}
        className="min-h-[160px] p-3 rounded bg-[#2d2d2d] border border-gray-700 focus:outline-none text-white
                   [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:ml-0 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:ml-0"
      />
    </div>
  );
};

export default RichTextEditor;
