// Author: Naveen Duhan
const parsePDB = (data) => {
    const lines = data.split('\n');
    const atoms = [];

    lines.forEach(line => {
        if (line.startsWith('ATOM') || line.startsWith('HETATM')) {
            const atom = {
                recordName: line.substring(0, 6).trim(),
                serial: parseInt(line.substring(6, 11).trim(), 10),
                name: line.substring(12, 16).trim(),
                alternateLocation: line.substring(16, 17).trim(),
                residueName: line.substring(17, 20).trim(),
                chainID: line.substring(21, 22).trim(),
                residueSequenceNumber: parseInt(line.substring(22, 26).trim(), 10),
                insertionCode: line.substring(26, 27).trim(),
                x: parseFloat(line.substring(30, 38).trim()),
                y: parseFloat(line.substring(38, 46).trim()),
                z: parseFloat(line.substring(46, 54).trim()),
                occupancy: parseFloat(line.substring(54, 60).trim()),
                tempFactor: parseFloat(line.substring(60, 66).trim()),
                segmentID: line.substring(72, 76).trim(),
                element: line.substring(76, 78).trim(),
                charge: line.substring(78, 80).trim()
            };
            atoms.push(atom);
        }
    });

    return {
        atoms: atoms
    };
};

module.exports = parsePDB
