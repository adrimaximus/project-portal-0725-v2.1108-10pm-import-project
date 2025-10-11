import Header from '@editorjs/header';
import NestedList from '@editorjs/nested-list';
import Paragraph from '@editorjs/paragraph';
import SimpleImage from '@editorjs/simple-image';
import Checklist from '@editorjs/checklist';
import Quote from '@editorjs/quote';
import CodeTool from '@editorjs/code';
import Embed from '@editorjs/embed';
import Table from '@editorjs/table';
import InlineCode from '@editorjs/inline-code';
import LinkTool from '@editorjs/link-tool';
import Delimiter from '@editorjs/delimiter';
import Warning from '@editorjs/warning';
import Marker from '@editorjs/marker';
import AttachesTool from '@editorjs/attaches';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const UPLOAD_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/upload-editorjs-file`;

export const EDITOR_JS_TOOLS = {
  paragraph: {
    class: Paragraph,
    inlineToolbar: true,
  },
  header: Header,
  list: NestedList,
  checklist: Checklist,
  quote: Quote,
  code: CodeTool,
  embed: Embed,
  table: Table,
  inlineCode: InlineCode,
  linkTool: LinkTool,
  image: SimpleImage,
  delimiter: Delimiter,
  warning: Warning,
  marker: Marker,
  attaches: {
    class: AttachesTool,
    config: {
      endpoint: UPLOAD_FUNCTION_URL,
    },
  },
};