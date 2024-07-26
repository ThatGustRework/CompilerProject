//Incluyo el modulo con la clase de analisis sintactico para español.
const spanishDb = require('./modules/spanish');

//Creo una instancia a la clase.
let spanish = new spanishDb();

//Analizo una oración desde archivo.
spanish.analyseTextFile('texto.txt')