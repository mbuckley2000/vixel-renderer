const Vixel = require('vixel');
const axios = require('axios');

const NUM_SAMPLES = 100;
const RESOLUTION = [600, 400];

//CONFIG
const material = {
    red: 1.0, 	    //The red component of the voxel color.
    green: 0.5,	    //The green component of the voxel color.
    blue: 0.25,	    //The blue component of the voxel color.
    rough: 1,	    //The roughness of the voxel surface. Zero is perfectly smooth, one is completely rough.
    metal: 0,	    //The metalness of the voxel surface. Zero is completely nonmetallic, one is fully metallic.
    transparent: 0, //The transparency of the voxel. Zero is completely opaque, one is completely clear.
    refract: 0,	    //The refraction index of the voxel. Air has a value of 1.0, glass is around 1.333.
    emit: 0.0,	    //The amount of light the voxel emits. If this is nonzero, rough, metal, transparent, and refract will be ignored.
};

getFile(getUrlParameter('filename'));

function getUrlParameter(name) {
    const processedName = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp(`[\\?&]${processedName}=([^&#]*)`);
    const currentURI = location.search;
    const results = regex.exec(currentURI);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

function getFile(file) {
    console.log(`Getting file ${file}`);

    axios.get(file, {
        responseType: 'arraybuffer'
    })
        .then((response) => {
            const { status, data } = response;
            if (status !== 200) {
                console.log(`Failed to get file with status code ${status}`);
            } else {
                // console.log(data);
                console.log('Success');
                processData(data);
            }
        })
        .catch((error) => {
            console.log(error);
        });
}

const addToGrid = (vixel, voxels, material) => {
    voxels.forEach((row) => {
        const cols = row.split(',');
        vixel.set(
            parseInt(cols[0], 10), // x
            parseInt(cols[1], 10), // y
            parseInt(cols[2], 10), // z
            material
        );
    });
};

const render = (canvas, voxels, dims) => {
    // Create a vixel object with a canvas and a width (x), height (y), and depth (z).
    const dimensions = [parseInt(dims[0], 10), parseInt(dims[1], 10), parseInt(dims[2], 10)];
    const vixel = new Vixel(canvas, dimensions[0], dimensions[1], dimensions[2]);

    addToGrid(vixel, voxels, material);

    //vixel.dof(150, 0.1);
    vixel.ground([2, 3, 4], 1, 0.5);
    vixel.camera(
        [dimensions[0] / 2, dimensions[1] / 2, dimensions[2] * 2], // Camera position
        [dimensions[0] / 2, dimensions[1] / 2, dimensions[2] / 2], // Camera target
        [0, 1, 0], // Up
        Math.PI / 4 // Field of view
    );

    vixel.sun(6.05, -0.1, 1, 0.15);

    // Take 1024 path traced samples per pixel
    vixel.sample(NUM_SAMPLES);

    // Show the result on the canvas
    vixel.display();
};

const parseRAWFile = (file) => {
    console.log('Parsing RAW file');

    const dataview = new DataView(file);
    const ints = new Uint8Array(file.byteLength);

    for (let i = 0; i < ints.length; i++) {
        ints[i] = dataview.getUint8(i);
    }

    const dim = Math.cbrt(ints.length);
    console.log(`Dimensions size: ${dim}`);
    const voxels = [];

    voxels.push(`${dim},${dim},${dim}`);

    let i = 0;
    for (let x = 0; x < dim; x++) {
        for (let y = 0; y < dim; y++) {
            for (let z = 0; z < dim; z++) {
                if (ints[i++] === 255) {
                    voxels.push(`${z},${y},${x}`);
                }
            }
        }
    }

    console.log(`Parsed ${voxels.length} voxels`);
    return voxels;
};

const processData = (data) => {
    const rows = parseRAWFile(data);
    // const rows = data.split(';');
    const dim = rows.shift().split(',');
    console.log(`Dimensions: X:${dim[0]} Y:${dim[1]} Z:${dim[2]}`);
    console.log(`Num Voxels: ${rows.length}`);

    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    canvas.width = RESOLUTION[0];
    canvas.height = RESOLUTION[1];

    render(canvas, rows, dim);
};
