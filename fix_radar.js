const fs = require('fs');
let c = fs.readFileSync('frontend/src/views/RadarHunters.jsx', 'utf8');

c = c.replace(
`}
            setXpData(xpMap);
         }
      }
    } catch (e) {`, 
`}
            } // fechamento do for loop
            setXpData(xpMap);
         }
      }
    } catch (e) {`);

fs.writeFileSync('frontend/src/views/RadarHunters.jsx', c, 'utf8');
