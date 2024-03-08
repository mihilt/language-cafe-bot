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
    echo "=> Node.js is running well."
    docker stop $CONTAINER_NAME-temp
    docker rm $CONTAINER_NAME-temp
else
    echo "=> Node.js is not running well."
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

sleep 1

# remove container
echo "=> Remove container..."
docker rm $CONTAINER_NAME

sleep 1

# run container
echo "=> Run container..."
docker run -v /opt/docker-data/language-cafe-bot/db:/app/src/db/data -d -p 4000:4000 --restart always --name $CONTAINER_NAME $IMAGE_NAME

# remove dangling images
echo "=> Remove dangling images..."
docker rmi $(docker images -f "dangling=true" -q)

# put timestamp to tar file
echo "=> Put timestamp to tar file..."
mv ./language-cafe-bot.tar ./language-cafe-bot-$(date +%Y%m%d%H%M%S).tar

# show logs
echo "=> Show logs..."
docker logs -f $CONTAINER_NAME