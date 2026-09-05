import io
import os

from flask import Flask, jsonify, render_template, request, send_file
from pypdf import PdfReader, PdfWriter
from pypdf.errors import PdfReadError

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50 MB per request


@app.errorhandler(413)
def too_large(_err):
    return jsonify(error="Total upload size exceeds the 50 MB limit."), 413


@app.route("/")
def index():
    return render_template("index.html", active_page="merge")


@app.route("/merge", methods=["POST"])
def merge():
    files = request.files.getlist("files")

    if len(files) < 2:
        return jsonify(error="Select at least 2 PDF files to merge."), 400

    writer = PdfWriter()
    for f in files:
        if not f.filename.lower().endswith(".pdf"):
            return jsonify(error=f'"{f.filename}" is not a PDF file.'), 400
        try:
            reader = PdfReader(f.stream)
            if reader.is_encrypted:
                return jsonify(error=f'"{f.filename}" is password-protected.'), 400
            for page in reader.pages:
                writer.add_page(page)
        except PdfReadError:
            return jsonify(error=f'Could not read "{f.filename}" — it may be corrupted.'), 400

    buffer = io.BytesIO()
    writer.write(buffer)
    buffer.seek(0)

    return send_file(
        buffer,
        mimetype="application/pdf",
        as_attachment=True,
        download_name="merged.pdf",
    )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(host="0.0.0.0", port=port, debug=debug)
