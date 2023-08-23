IMAGE_NAME="wonsigi-bot"
CONTAINER_NAME="wonsigi-bot"

# decompress build.tar
echo "=> Decompress build.tar..."
tar -xf ./build.tar

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
docker run -v ~/docker-data/wonsigi-bot/db:/app/src/db/data --rm -d -p 4000:4000 --name $CONTAINER_NAME $IMAGE_NAME

# remove dangling images
echo "=> Remove dangling images..."
docker rmi $(docker images -f "dangling=true" -q)