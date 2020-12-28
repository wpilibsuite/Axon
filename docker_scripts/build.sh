name=axon

name_with_tag="wpilib/${name}:latest"

docker build  -t ${name} ..
docker tag ${name} ${name_with_tag}
docker push ${name_with_tag}
