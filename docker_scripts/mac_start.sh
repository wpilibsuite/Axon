open http://localhost:3000
docker run -t -i -v /var/run/docker.sock:/var/run/docker.sock -p 3000:3000 -p 4000:4000 wpilib/axon:latest
