import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Play, Save } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  setCode: (code: string) => void;
  sessionActive: boolean;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  runCode: () => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  setCode,
  sessionActive,
  onKeyDown,
  onPaste,
  textareaRef,
  runCode
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          Problem: Implement a function to reverse a string efficiently
        </label>
        <Textarea 
          ref={textareaRef} 
          placeholder="Write your code here..." 
          value={code} 
          onChange={e => setCode(e.target.value)} 
          onKeyDown={onKeyDown} 
          onPaste={onPaste} 
          className="min-h-96 font-mono text-sm bg-background border-input text-foreground" 
          disabled={!sessionActive} 
        />
      </div>
      
      <div className="flex space-x-2">
        <Button onClick={runCode} disabled={!sessionActive}>
          <Play className="h-4 w-4 mr-2" />
          Run Code
        </Button>
        <Button onClick={() => console.log('Saving...', code)} variant="outline" disabled={!sessionActive}>
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
      </div>
    </div>
  );
};