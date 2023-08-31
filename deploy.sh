IMAGE_NAME="language-cafe-bot"
CONTAINER_NAME="language-cafe-bot"

# decompress language-cafe-bot.tar
echo "=> Decompress language-cafe-bot.tar..."
tar -xf ./language-cafe-bot.tar

sleep 2

# build image
echo "=> Build image..."
docker build -t $IMAGE_NAME .

# stop container
echo "=> Stop container..."
docker stop $CONTAINER_NAME

sleep 2

# run container
echo "=> Run container..."
docker run -v ~/docker-data/language-cafe-bot/db:/app/src/db/data --rm -d -p 4000:4000 --name $CONTAINER_NAME $IMAGE_NAME

# remove dangling images
echo "=> Remove dangling images..."
docker rmi $(docker images -f "dangling=true" -q)