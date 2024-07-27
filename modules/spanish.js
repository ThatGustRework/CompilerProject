const fs = require('fs');

const FIN = -1;

let lexema = '';
let tok;
let tokens = [];
let currentTokenIndex = 0;

module.exports = class SpanishDb {
    constructor() {
        this.bd = null;
        this.ARTICLES = [];
        this.SUBJECTS = [];
        this.VERBS = [];
        this.classifyWords();
    }

    loadBdFromFile() {
        // Load data from a JSON file
        let str = fs.readFileSync('./diccionario/spanish.json').toString();

        // Parse the JSON
        let struct = JSON.parse(str);

        // Validate data
        if (str != null && struct != null)
            this.bd = struct;
        else
            console.log("Error: Json de idioma mal armado.");
    }

    findWordToken(word) {
        let resu = [];

        // List of  and arrays
        let listFn = [
            { list: this.bd.adjetivos, val: 'adjetivo', fn: this.findElemNomb },
            { list: this.bd.adverbios, val: 'adverbio', fn: this.findElemNomb },
            { list: this.bd.preposiciones, val: 'preposicion', fn: this.findElemNomb },
            { list: this.bd.sustantivos, val: 'sustantivo', fn: this.findElemNomb },
            { list: this.bd.verbos, val: 'verbo', fn: this.findElemNomb },
            { list: this.bd.pronombres, val: 'pronombre', fn: this.findElemNomb },
            { list: this.bd.personas, val: 'persona', fn: this.findElemNomb },
            { list: this.bd.lugares, val: 'lugar', fn: this.findElemNomb }
        ];

        // Check each word against categories
        listFn.forEach((item) => {
            if (item.fn(item.list, word))
                resu.push(item.val);
        });

        if (!isNaN(word)) resu.push('numero');

        return resu;
    }

    findElemNomb(items, word) {
        const cleanStr = (cadena) => {
            cadena = cadena.replace(/á/gi, "a");
            cadena = cadena.replace(/é/gi, "e");
            cadena = cadena.replace(/í/gi, "i");
            cadena = cadena.replace(/ó/gi, "o");
            cadena = cadena.replace(/ú/gi, "u");
            cadena = cadena.replace(/ñ/gi, "n");
            cadena = cadena.replace(/Á/gi, "A");
            cadena = cadena.replace(/É/gi, "E");
            cadena = cadena.replace(/Í/gi, "I");
            cadena = cadena.replace(/Ó/gi, "O");
            cadena = cadena.replace(/Ú/gi, "U");
            cadena = cadena.replace(/Ñ/gi, "N");

            return cadena.toUpperCase();
        };

        return (items[cleanStr(word)] != null);
    }

	//Parseo una oración y reviso a que grupo pertenece cada palabra.
	analyseText(texto){
		let final   = [];

		//Parseo en base a los espacios en blanco.
		let bloques = texto.split(" ");

		//Itero palabra por palabra
		bloques.forEach((elem)=>{			
			//Traigo los grupos que pertenece cada palabra.
			let token = this.findWordToken(elem);

			//Grabo los resultados del analisis.
			final.push({"word":elem,"token":token});
		});
		return final;
	}

	//Parseo la oración y la obtengo en forma de array.
	analyseTextArray(texto){
		let resu   = this.analyseText(texto);
		let salida = [];

		resu.forEach((item)=>{
			salida[item.word]=item.token;
		});

		return salida;
	}

    classifyWords() {
        // Classify words based on their tokens
        this.loadBdFromFile();
    
        if (this.bd) {
            this.ARTICLES = this.bd.pronombres || [];
            this.SUBJECTS = this.bd.sustantivos || [];
            this.VERBS = this.bd.verbos || [];
        }
        
        //console.log('Initial VERBS:', this.VERBS);  // Add this line to check initialization
        // Add conjugated verbs to the VERBS array
        this.addConjugatedVerbs();
    }

    addConjugatedVerbs() {
        // console.log('VERBS Type:', Array.isArray(this.VERBS));  // Check if it's an array
        // console.log('VERBS:', this.VERBS);

        const conjugated = [];

        if (Array.isArray(this.VERBS)) {
            this.VERBS.forEach((verb) => {
                const forms = this.conjugateVerb(verb);
                if (forms) {
                    conjugated.push(...forms);
                }
            });

            // Add conjugated forms to the original VERBS list
            this.VERBS = this.VERBS.concat(conjugated);
        } else {
            console.error('VERBS is not an array');
        }
    }

    conjugateVerb(verb) {
        // Conjugation endings for regular verbs
        const endings = {
            'ar': ['o', 'as', 'a', 'amos', 'áis', 'an'],
            'er': ['o', 'es', 'e', 'emos', 'éis', 'en'],
            'ir': ['o', 'es', 'e', 'imos', 'ís', 'en']
        };

        let stem, verbType, pronoun;

        // Determine verb type (-ar, -er, -ir) and conjugate
        if (verb.endsWith('arse')) {
            stem = verb.slice(0, -4);  // Remove 'arse' to get the stem
            pronoun = "me ";
            verbType = 'ar';
        } else if (verb.endsWith('erse')) {
            stem = verb.slice(0, -4);  // Remove 'erse' to get the stem
            pronoun = "me ";
            verbType = 'er';
        } else if (verb.endsWith('irse')) {
            stem = verb.slice(0, -4);  // Remove 'irse' to get the stem
            pronoun = "me ";
            verbType = 'ir';
        } else {
            if (verb.endsWith('ar')) {
                stem = verb.slice(0, -2);  // Remove 'ar' to get the stem
                verbType = 'ar';
                pronoun = "";
            } else if (verb.endsWith('er')) {
                stem = verb.slice(0, -2);  // Remove 'er' to get the stem
                verbType = 'er';
                pronoun = "";
            } else if (verb.endsWith('ir')) {
                stem = verb.slice(0, -2);  // Remove 'ir' to get the stem
                verbType = 'ir';
                pronoun = "";
            } else {
                return null;  // Unknown verb type
            }
        }

        // Conjugate verb
        const conjugatedForms = endings[verbType].map(ending => `${pronoun}${stem}${ending}`);
        return conjugatedForms;
    }

    analyseTextFile(file) {
        const input = fs.readFileSync(file, 'utf-8');
        const lines = input.split('.');

        for (const line of lines) {
            if (line.trim() === '') continue;

            const cleanLine = line.replace(/[\r\n]+/g, '');
            console.log(cleanLine);

            tokens = line.trim().split(/\s+/);
            currentTokenIndex = 0;
            tok = this.scanner();

            this.parseSentence();

            if (tok !== FIN) this.error();

            console.log('La oración es válida.');
        }
    }

    parea(expectedToken) {
        if (tok === expectedToken) {
            tok = this.scanner();
        } else {
            this.error();
        }
    }
    
    error() {
        console.error('Syntax error');
        process.exit(1);
    }
    
    scanner() {
        if (currentTokenIndex >= tokens.length) return FIN;
    
        const token = tokens[currentTokenIndex++];
        lexema = token;
        return token;
    }
    
    Oracion() {
        if (this.findElemNomb(this.ARTICLES, tok) || this.findElemNomb(this.SUBJECTS, tok)) {
            this.Sujeto();
            this.Predicado();
        } else {
            console.log('Falló en Oracion');
            this.error();
        }
    }

    // Analizar una oración completa.

    parseSentence() {
        if (this.findElemNomb(this.ARTICLES, tok) || this.findElemNomb(this.SUBJECTS, tok)) {
            this.Sujeto();
            this.Predicado();
        } else if (this.findElemNomb(this.VERBS, tok)) {
            this.Predicado();
        } else {
            console.log('Falló en Oracion');
            this.error();
        }
    }
    
    
    Sujeto() {
        if(this.findElemNomb(this.ARTICLES, tok)){
            this.Articulo();
            this.Sustantivo();
        } else if (this.findElemNomb(this.SUBJECTS, tok)) {
            this.Sustantivo();
        } else {
            console.log('Falló en Sujeto');
            this.error();
        }
    }
    
    Sustantivo() {
        if (this.findElemNomb(this.SUBJECTS, tok)) {
            this.parea(tok);
        } else {
            console.log('Falló en Sustantivo');
            this.error();
        }
    }
    
    Predicado() {
        if (this.findElemNomb(this.VERBS, tok)) {
            this.Verbo();
        } else {
            console.log('Falló en predicado');
            this.error();
        }
    }
    
    Articulo() {
        if (this.findElemNomb(this.ARTICLES, tok)) {
            this.parea(tok);
        } else {
            console.log('Falló en articulo');
            this.error();
        }
    }
    
    Verbo() {
        if (this.findElemNomb(this.VERBS, tok)) {
            this.parea(tok);
        } else {
            console.log('Falló en verbo');
            this.error();
        }
    }
}
