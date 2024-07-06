OUTPUT_FILE="../language-cafe-bot.tar"

echo "=> Creating tar file excluding patterns from .tarignore..."
tar -cf $OUTPUT_FILE --exclude-from=.tarignore .

if [ -f $OUTPUT_FILE ]; then
    echo "=> Tar file created successfully: $OUTPUT_FILE"
else
    echo "=> Failed to create tar file."
    exit 1
fi

echo "=> Opening directory containing tar file..."
open ../

echo "=> Done."
