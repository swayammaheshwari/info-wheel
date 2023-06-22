let editor;
// alert("working");

document.addEventListener("DOMContentLoaded", function () {
  editor = new EditorJS({
    holder: "editorjs",
    autofocus: true,
    tools: {
      header: {
        class: Header,
        inlineToolbar: true,
      },
      list: {
        class: List,
        inlineToolbar: true,
      },
      image: {
        class: ImageTool,
        config: {
          endpoints: {
            byFile: `http://localhost:5000/uploadEditor/`, // Replace with your backend URL for image upload
          },
          additionalRequestHeaders: {
            // Add any necessary headers for authentication or other purposes
            // For example:
            Authorization: "Bearer your-token",
          },
          onFileUploadResponse: (response) => {
            if (response.success) {
              const imageUrl = response.file.url;
              const block = editor.blocks.insert("image", {
                url: imageUrl,
              });
              editor.caret.setToBlock(block);
            } else {
              console.error("Image upload failed:", response.message);
            }
          },
        },
      },
    },
    onChange: function () {},
  });
});

function submitForm(event) {
  event.preventDefault();

  editor
    .save()
    .then((outputData) => {
      const editorContent = document.getElementById("editorContent");
      editorContent.value = JSON.stringify(outputData);

      // Submit the form
      event.target.submit();
    })
    .catch((error) => {
      console.error("Error saving editor content:", error);
    });
}
////////////////////////////////////////////////////////
