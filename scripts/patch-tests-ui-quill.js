const fs = require('fs');

let content = fs.readFileSync('src/app/dashboard/tests/page.tsx', 'utf8');

// 1. Import dynamic
if (!content.includes('import dynamic from "next/dynamic"')) {
  content = content.replace(
    'import React, { useState, useEffect, useRef } from "react";',
    'import React, { useState, useEffect, useRef } from "react";\nimport dynamic from "next/dynamic";'
  );
}

// 2. Add ReactQuill import and css
if (!content.includes('const ReactQuill = dynamic')) {
  content = content.replace(
    'import { Skeleton } from "@/components/ui/skeleton";',
    'import { Skeleton } from "@/components/ui/skeleton";\nimport "react-quill/dist/quill.snow.css";\nconst ReactQuill = dynamic(() => import("react-quill"), { ssr: false });'
  );
}

// 3. Add states
if (!content.includes('const [interpretation, setInterpretation]')) {
  content = content.replace(
    'const [customCategory, setCustomCategory] = useState("");',
    'const [customCategory, setCustomCategory] = useState("");\n  const [interpretation, setInterpretation] = useState("");\n  const [interpretationModalOpen, setInterpretationModalOpen] = useState(false);'
  );
}

// 4. Update handleOpenAddDialog
content = content.replace(
  'setPrice("");',
  'setPrice("");\n    setInterpretation("");'
);

// 5. Update handleOpenEditDialog
content = content.replace(
  'setPrice(test.price.toString());',
  'setPrice(test.price.toString());\n    setInterpretation(test.interpretation || "");'
);

// 6. Update handleSaveTest payload
content = content.replace(
  'name: name.trim(), category: finalCategory, fieldType: "Group", type, price: parseFloat(price),',
  'name: name.trim(), category: finalCategory, fieldType: "Group", type, price: parseFloat(price), interpretation,'
);

// 7. Add View Interpretation button
if (!content.includes('View Interpretation')) {
  const buttonCode = `</div>
              
              <div className="flex justify-start">
                <Button type="button" variant="outline" onClick={() => setInterpretationModalOpen(true)} className="gap-2">
                  <FileText className="h-4 w-4" />
                  View Interpretation
                </Button>
              </div>

              <div className="border-t`;
  content = content.replace(
    '</div>\n\n              <div className="border-t',
    buttonCode
  );
}

// 8. Add Interpretation Modal
if (!content.includes('Interpretation Modal')) {
  const modalCode = `      {/* Interpretation Modal */}
      <Dialog open={interpretationModalOpen} onOpenChange={setInterpretationModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Interpretation</DialogTitle>
            <DialogDescription>Design the interpretation for this test.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            <ReactQuill theme="snow" value={interpretation} onChange={setInterpretation} style={{ height: "400px", marginBottom: "50px" }} />
          </div>
          <DialogFooter>
            <Button onClick={() => setInterpretationModalOpen(false)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}`;
  content = content.replace(
    '    </div>\n  );\n}',
    modalCode
  );
}

fs.writeFileSync('src/app/dashboard/tests/page.tsx', content);
console.log('UI Patched for Quill');
