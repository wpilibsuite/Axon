# Axon (ml-app)

![CI](https://github.com/wpilibsuite/ml-react-app/workflows/CI/badge.svg)

![logo](./logo.png)

Welcome to the WPILib project. This repository contains Axon.

- [WPILib Mission](#wpilib-mission)
- [Building (Development)](#building-development)
- [Building (Release)](#building-release)
- [Contributing to WPILib](#contributing-to-wpilib)

## WPILib Mission

The WPILib Mission is to enable FIRST teams to focus on writing game-specific software rather than on hardware details "raise the floor, don't lower the ceiling". We try to enable teams with limited programming knowledge and/or mentor experience to do as much as possible, while not hampering the abilities of teams with more advanced programming capabilities. We support Kit of Parts control system components directly in the library. We also strive to keep parity between major features of each language (Java, C++, and NI's LabVIEW), so that teams aren't at a disadvantage for choosing a specific programming language. WPILib is an open-source project, licensed under the BSD 3-clause license. You can find a copy of the license [here](https://github.com/wpilibsuite/allwpilib/blob/master/LICENSE.txt).

# Building (Development)

Building Axon is very straightforward. Axon uses yarn to compile.

## Requirements

- [Docker](https://www.docker.com/)
- [Node.js 14](https://nodejs.org/)
- [Yarn pkg](https://yarnpkg.com/)

To install additional required packages before launching, run the command `yarn`.

## Running

To run Axon outside the prebuilt Docker container use the command `yarn start` and navigate to `http://localhost:3000/`

Ensure Docker is running on your machine, or the required images will not be able to start. If it is your first time
running the program, ensure you have run `yarn install` and `yarn generate`

# Building (Release)

To make Axon portable and easy to use, we provide a Docker image to run it.

## Requirements

- [Docker](https://www.docker.com/)

## Building

To build locally use
`docker build --build-arg AXON_VERSION=<version> -t <tag-name> .`
where `<tag-name>` is an arbitrary name of your choosing.

## Running

To run using the latest published version use
`docker run -t -i -v /var/run/docker.sock:/var/run/docker.sock -v wpilib-axon-volume:/usr/src/app/packages/server/data -p 3000:3000 -p 4000:4000 --pull=always <tag-name>`

To run based on a local built image use
`docker run -t -i -v /var/run/docker.sock:/var/run/docker.sock -v wpilib-axon-volume:/usr/src/app/packages/server/data -p 3000:3000 -p 4000:4000 <tag-name>`
where `<tag-name>` is the name set in the previous step.

# Contributing to WPILib

See [CONTRIBUTING.md](https://github.com/wpilibsuite/allwpilib/blob/master/CONTRIBUTING.md).
