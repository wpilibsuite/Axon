import * as path from "path";
import * as fs from "fs";
import { spawn } from "child_process";

type CreateParameters = {
  labels: string[];
  limit: number;
};

export type CheckLabelsResult = {
  success: boolean;
  failingLabel: string;
};

export default class Creator {
  readonly classes: string[];
  readonly maxImages: number;
  readonly directory: string;
  readonly id: string;

  public constructor(classes: string[], maxImages: number, id: string) {
    this.classes = classes;
    this.maxImages = maxImages;
    this.directory = `data/create/${id}`;
    this.id = id;
  }

  public checkLabels(): CheckLabelsResult {
    const validLabels = this.getValidLabels();
    for (let i = 0; i < this.classes.length; i++) {
      if (!validLabels.includes(this.classes[i].toLowerCase())) {
        return {
          success: false,
          failingLabel: this.classes[i]
        };
      }
    }
    return {
      success: true,
      failingLabel: ""
    };
  }

  /**
   * Create the training parameter file in the container's mounted directory to control the container.
   */
  public async writeParameterFile(): Promise<void> {
    const createParameters: CreateParameters = {
      labels: this.classes,
      limit: this.maxImages
    };

    const HYPERPARAMETER_FILE_PATH = path.posix.join(this.directory, "data.json");
    console.log(`Create config data created at ${HYPERPARAMETER_FILE_PATH}`);
    await fs.promises.writeFile(HYPERPARAMETER_FILE_PATH, JSON.stringify(createParameters));
  }

  /**
   * Starts training. Needs to have the dataset record and hyperparameters.json in the working directory.
   */
  public async createDataset(): Promise<void> {
    console.log("Spawning child process");

    const python = spawn("python", ["src/assets/openaxon.py", this.id]);

    python.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    python.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    const exitCode = await new Promise((resolve, reject) => {
      python.on("close", resolve);
    });

    if (exitCode) {
      throw new Error(`subprocess error exit ${exitCode}`);
    }
    return;
  }

  public getValidLabels(): string[] {
    return [
      "accordion",
      "adhesive tape",
      "aircraft",
      "airplane",
      "alarm clock",
      "alpaca",
      "ambulance",
      "animal",
      "ant",
      "antelope",
      "apple",
      "armadillo",
      "artichoke",
      "auto part",
      "axe",
      "backpack",
      "bagel",
      "baked goods",
      "balance beam",
      "ball",
      "balloon",
      "banana",
      "band-aid",
      "banjo",
      "barge",
      "barrel",
      "baseball bat",
      "baseball glove",
      "bat (animal)",
      "bathroom accessory",
      "bathroom cabinet",
      "bathtub",
      "beaker",
      "bear",
      "bed",
      "bee",
      "beehive",
      "beer",
      "beetle",
      "bell pepper",
      "belt",
      "bench",
      "bicycle",
      "bicycle helmet",
      "bicycle wheel",
      "bidet",
      "billboard",
      "billiard table",
      "binoculars",
      "bird",
      "blender",
      "blue jay",
      "boat",
      "bomb",
      "book",
      "bookcase",
      "boot",
      "bottle",
      "bottle opener",
      "bow and arrow",
      "bowl",
      "bowling equipment",
      "box",
      "boy",
      "brassiere",
      "bread",
      "briefcase",
      "broccoli",
      "bronze sculpture",
      "brown bear",
      "building",
      "bull",
      "burrito",
      "bus",
      "bust",
      "butterfly",
      "cabbage",
      "cabinetry",
      "cake",
      "cake stand",
      "calculator",
      "camel",
      "camera",
      "can opener",
      "canary",
      "candle",
      "candy",
      "cannon",
      "canoe",
      "cantaloupe",
      "car",
      "carnivore",
      "carrot",
      "cart",
      "cassette deck",
      "castle",
      "cat",
      "cat furniture",
      "caterpillar",
      "cattle",
      "ceiling fan",
      "cello",
      "centipede",
      "chainsaw",
      "chair",
      "cheese",
      "cheetah",
      "chest of drawers",
      "chicken",
      "chime",
      "chisel",
      "chopsticks",
      "christmas tree",
      "clock",
      "closet",
      "clothing",
      "coat",
      "cocktail",
      "cocktail shaker",
      "coconut",
      "coffee",
      "coffee cup",
      "coffee table",
      "coffeemaker",
      "coin",
      "common fig",
      "common sunflower",
      "computer keyboard",
      "computer monitor",
      "computer mouse",
      "container",
      "convenience store",
      "cookie",
      "cooking spray",
      "corded phone",
      "cosmetics",
      "couch",
      "countertop",
      "cowboy hat",
      "crab",
      "cream",
      "cricket ball",
      "crocodile",
      "croissant",
      "crown",
      "crutch",
      "cucumber",
      "cupboard",
      "curtain",
      "cutting board",
      "dagger",
      "dairy product",
      "deer",
      "desk",
      "dessert",
      "diaper",
      "dice",
      "digital clock",
      "dinosaur",
      "dishwasher",
      "dog",
      "dog bed",
      "doll",
      "dolphin",
      "door",
      "door handle",
      "doughnut",
      "dragonfly",
      "drawer",
      "dress",
      "drill (tool)",
      "drink",
      "drinking straw",
      "drum",
      "duck",
      "dumbbell",
      "eagle",
      "earrings",
      "egg (food)",
      "elephant",
      "envelope",
      "eraser",
      "face powder",
      "facial tissue holder",
      "falcon",
      "fashion accessory",
      "fast food",
      "fax",
      "fedora",
      "filing cabinet",
      "fire hydrant",
      "fireplace",
      "fish",
      "flag",
      "flashlight",
      "flower",
      "flowerpot",
      "flute",
      "flying disc",
      "food",
      "food processor",
      "football",
      "football helmet",
      "footwear",
      "fork",
      "fountain",
      "fox",
      "french fries",
      "french horn",
      "frog",
      "fruit",
      "frying pan",
      "furniture",
      "garden asparagus",
      "gas stove",
      "giraffe",
      "girl",
      "glasses",
      "glove",
      "goat",
      "goggles",
      "goldfish",
      "golf ball",
      "golf cart",
      "gondola",
      "goose",
      "grape",
      "grapefruit",
      "grinder",
      "guacamole",
      "guitar",
      "hair dryer",
      "hair spray",
      "hamburger",
      "hammer",
      "hamster",
      "hand dryer",
      "handbag",
      "handgun",
      "harbor seal",
      "harmonica",
      "harp",
      "harpsichord",
      "hat",
      "headphones",
      "heater",
      "hedgehog",
      "helicopter",
      "helmet",
      "high heels",
      "hiking equipment",
      "hippopotamus",
      "home appliance",
      "honeycomb",
      "horizontal bar",
      "horse",
      "hot dog",
      "house",
      "houseplant",
      "human arm",
      "human beard",
      "human body",
      "human ear",
      "human eye",
      "human face",
      "human foot",
      "human hair",
      "human hand",
      "human head",
      "human leg",
      "human mouth",
      "human nose",
      "humidifier",
      "ice cream",
      "indoor rower",
      "infant bed",
      "insect",
      "invertebrate",
      "ipod",
      "isopod",
      "jacket",
      "jacuzzi",
      "jaguar (animal)",
      "jeans",
      "jellyfish",
      "jet ski",
      "jug",
      "juice",
      "kangaroo",
      "kettle",
      "kitchen & dining room table",
      "kitchen appliance",
      "kitchen knife",
      "kitchen utensil",
      "kitchenware",
      "kite",
      "knife",
      "koala",
      "ladder",
      "ladle",
      "ladybug",
      "lamp",
      "land vehicle",
      "lantern",
      "laptop",
      "lavender (plant)",
      "lemon",
      "leopard",
      "light bulb",
      "light switch",
      "lighthouse",
      "lily",
      "limousine",
      "lion",
      "lipstick",
      "lizard",
      "lobster",
      "loveseat",
      "luggage and bags",
      "lynx",
      "magpie",
      "mammal",
      "man",
      "mango",
      "maple",
      "maracas",
      "marine invertebrates",
      "marine mammal",
      "measuring cup",
      "mechanical fan",
      "medical equipment",
      "microphone",
      "microwave oven",
      "milk",
      "miniskirt",
      "mirror",
      "missile",
      "mixer",
      "mixing bowl",
      "mobile phone",
      "monkey",
      "moths and butterflies",
      "motorcycle",
      "mouse",
      "muffin",
      "mug",
      "mule",
      "mushroom",
      "musical instrument",
      "musical keyboard",
      "nail (construction)",
      "necklace",
      "nightstand",
      "oboe",
      "office building",
      "office supplies",
      "orange",
      "organ (musical instrument)",
      "ostrich",
      "otter",
      "oven",
      "owl",
      "oyster",
      "paddle",
      "palm tree",
      "pancake",
      "panda",
      "paper cutter",
      "paper towel",
      "parachute",
      "parking meter",
      "parrot",
      "pasta",
      "pastry",
      "peach",
      "pear",
      "pen",
      "pencil case",
      "pencil sharpener",
      "penguin",
      "perfume",
      "person",
      "personal care",
      "personal flotation device",
      "piano",
      "picnic basket",
      "picture frame",
      "pig",
      "pillow",
      "pineapple",
      "pitcher (container)",
      "pizza",
      "pizza cutter",
      "plant",
      "plastic bag",
      "plate",
      "platter",
      "plumbing fixture",
      "polar bear",
      "pomegranate",
      "popcorn",
      "porch",
      "porcupine",
      "poster",
      "potato",
      "power plugs and sockets",
      "pressure cooker",
      "pretzel",
      "printer",
      "pumpkin",
      "punching bag",
      "rabbit",
      "raccoon",
      "racket",
      "radish",
      "ratchet (device)",
      "raven",
      "rays and skates",
      "red panda",
      "refrigerator",
      "remote control",
      "reptile",
      "rhinoceros",
      "rifle",
      "ring binder",
      "rocket",
      "roller skates",
      "rose",
      "rugby ball",
      "ruler",
      "salad",
      "salt and pepper shakers",
      "sandal",
      "sandwich",
      "saucer",
      "saxophone",
      "scale",
      "scarf",
      "scissors",
      "scoreboard",
      "scorpion",
      "screwdriver",
      "sculpture",
      "sea lion",
      "sea turtle",
      "seafood",
      "seahorse",
      "seat belt",
      "segway",
      "serving tray",
      "sewing machine",
      "shark",
      "sheep",
      "shelf",
      "shellfish",
      "shirt",
      "shorts",
      "shotgun",
      "shower",
      "shrimp",
      "sink",
      "skateboard",
      "ski",
      "skirt",
      "skull",
      "skunk",
      "skyscraper",
      "slow cooker",
      "snack",
      "snail",
      "snake",
      "snowboard",
      "snowman",
      "snowmobile",
      "snowplow",
      "soap dispenser",
      "sock",
      "sofa bed",
      "sombrero",
      "sparrow",
      "spatula",
      "spice rack",
      "spider",
      "spoon",
      "sports equipment",
      "sports uniform",
      "squash (plant)",
      "squid",
      "squirrel",
      "stairs",
      "stapler",
      "starfish",
      "stationary bicycle",
      "stethoscope",
      "stool",
      "stop sign",
      "strawberry",
      "street light",
      "stretcher",
      "studio couch",
      "submarine",
      "submarine sandwich",
      "suit",
      "suitcase",
      "sun hat",
      "sunglasses",
      "surfboard",
      "sushi",
      "swan",
      "swim cap",
      "swimming pool",
      "swimwear",
      "sword",
      "syringe",
      "table",
      "table tennis racket",
      "tablet computer",
      "tableware",
      "taco",
      "tank",
      "tap",
      "tart",
      "taxi",
      "tea",
      "teapot",
      "teddy bear",
      "telephone",
      "television",
      "tennis ball",
      "tennis racket",
      "tent",
      "tiara",
      "tick",
      "tie",
      "tiger",
      "tin can",
      "tire",
      "toaster",
      "toilet",
      "toilet paper",
      "tomato",
      "tool",
      "toothbrush",
      "torch",
      "tortoise",
      "towel",
      "tower",
      "toy",
      "traffic light",
      "traffic sign",
      "train",
      "training bench",
      "treadmill",
      "tree",
      "tree house",
      "tripod",
      "trombone",
      "trousers",
      "truck",
      "trumpet",
      "turkey",
      "turtle",
      "umbrella",
      "unicycle",
      "van",
      "vase",
      "vegetable",
      "vehicle",
      "vehicle registration plate",
      "violin",
      "volleyball (ball)",
      "waffle",
      "waffle iron",
      "wall clock",
      "wardrobe",
      "washing machine",
      "waste container",
      "watch",
      "watercraft",
      "watermelon",
      "weapon",
      "whale",
      "wheel",
      "wheelchair",
      "whisk",
      "whiteboard",
      "willow",
      "window",
      "window blind",
      "wine",
      "wine glass",
      "wine rack",
      "winter melon",
      "wok",
      "woman",
      "wood-burning stove",
      "woodpecker",
      "worm",
      "wrench",
      "zebra",
      "zucchini"
    ];
  }
}
