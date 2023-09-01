IMAGE_NAME="language-cafe-bot"
CONTAINER_NAME="language-cafe-bot"

# decompress language-cafe-bot.tar
echo "=> Decompress language-cafe-bot.tar..."
tar -xf ./language-cafe-bot.tar

sleep 2

# build image
echo "=> Build image..."
docker build -t $IMAGE_NAME .

# check if new image works well by running container
echo "=> Check if new image works well by running container..."
docker run -d -p 4001:4001 --name $IMAGE_NAME-temp $IMAGE_NAME

sleep 5

if docker ps -q --filter "name=$CONTAINER_NAME-temp" | grep -q .; then
    echo "=> Node is running well."
    docker stop $CONTAINER_NAME-temp
    docker rm $CONTAINER_NAME-temp
else
    echo "=> Node is not running well."
    echo "##############################################"
    echo "             CHECK ERROR LOGS                "
    echo "##############################################"
    docker logs $CONTAINER_NAME-temp
    echo "##############################################"
    docker rm $CONTAINER_NAME-temp
    exit 1
fi

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