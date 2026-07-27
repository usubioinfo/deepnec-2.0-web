# Third-party notices

## S4PRED

DeepNEC 2.0 Web integrates [S4PRED](https://github.com/psipred/s4pred) for single-sequence secondary-structure prediction. S4PRED is maintained by the PSIPRED team and distributed under the GNU General Public License, version 3. Its source and complete license text are included in the `s4pred` submodule. The Docker build downloads the official S4PRED model weights and verifies the upstream MD5 checksum before extraction.

S4PRED should be cited as: Moffat L and Jones DT (2021), “Increasing the accuracy of single sequence prediction methods using a deep semi-supervised learning framework,” *Bioinformatics* 37(21):3744–3751. https://doi.org/10.1093/bioinformatics/btab337

The first-party DeepNEC 2.0 Web code is distributed under the GNU General Public License, version 3.0 (`GPL-3.0-only`). S4PRED remains a separately attributed GPL-3.0 component; redistributors are responsible for satisfying its license terms and retaining its notices.

## Vendored browser utilities

`frontend/src/Components/Sstructure/getEmPixels.js` is the MIT-licensed getEmPixels utility by Tyson Matanich (2013); its original author and license notice are retained in the source file. `frontend/src/Components/Sstructure/color-palette.js` contains ColorBrewer palette data developed by Cynthia Brewer and Mark Harrower. These two vendored files intentionally retain their upstream attribution rather than a DeepNEC author header.
