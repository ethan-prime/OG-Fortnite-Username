//ACCESS AT -- https://og-fortnite-api.herokuapp.com/

const letter_dict = {
    "P":"Р",
    "p":"р",
    "A":"А",
    "a":"а",
    "B":"В",
    "C":"С",
    "E":"Е",
    "e":"е",
    "H":"Н",
    "I":"І",
    "j":"ј",
    "J":"Ј",
    "K":"К",
    "M":"М",
    "O":"О",
    "o":"о",
    "T":"Т",
    "X":"Х",
    "x":"х",
    "Y":"Ү",
    "y":"у"
}

const express = require('express');
const app = express();
const axios = require('axios');
const PORT = process.env.PORT || 3000;

const link = 'https://www.epicgames.com/id/api/account/name/state/';

app.use(express.json());

function remove_duplicates(arr) {
    var array = [...arr];
    var seen = [];
    for(i=array.length-1;i>=0;i--) {
        if(seen.includes(array[i])) {
            array[i] = '';
        } else {
            seen.push(array[i]);
        }
    }
    var final_arr = [];
    for(i=0;i<array.length;i++) {
        if(array[i] != '') {
            final_arr.push(array[i]);
        }
    }
    return final_arr;
}

function gen_bool(chars, rounds) {
    var bools = [];
    for(x=0;x<rounds;x++) {
        var bool = [];
        for(y=0;y<chars;y++) {
            var random = Math.floor(Math.random()*100);
            if(random>=50) {
                bool.push('t');
            } else if (random < 50) {
                bool.push('f');
            }
        }
        bools.push(bool.join(''));
    }
    var r1 = remove_duplicates(bools);
    if(r1.includes('fff')) {
        r1.pop(r1.indexOf('fff'));
    }
    if(r1.length > 5) {
        r1 = r1.slice(4);
    }
    return r1;
}

function build_tries(name) {
    var indexes = [];
    for(y=0;y<name.length;y++) {
        if(letter_dict[name.charAt(y)]) {
            indexes.push(y);
        }
    }
    if(indexes.length == 0) {
        return [];
    } else {
        var output = gen_bool(indexes.length, 20);
        var tries = [];
        var split_name = [];
        for(x=0;x<name.length;x++) {
            split_name.push(name.charAt(x));
        }
        for(i=0;i<output.length;i++) {
            tries.push(split_name);
        }
    }
    for(x=0;x<tries.length;x++) {
        for(y=0;y<indexes.length;y++) {
            if(output[x].charAt(y) == 't') {
                tries[x][indexes[y]] = letter_dict[name.charAt(indexes[y])];
            } else if(output[x].charAt(y) == 'f') {
                tries[x][indexes[y]] = name.charAt(indexes[y]);
            } else {

            }
        }
        tries[x] = tries[x].join('');
    }
    return tries;
}

app.listen(PORT, () => {
    console.log(`Listening on PORT ${PORT}`);
});

app.get('/check', (req, res) => {
    var is_error = false;
    const { name } = req.body;
    if(!name) { 
        is_error = true;
        res.status(400).send({
            'message':'Please provide a name.'
        });
        return;
    }
    if(name.length < 3 || name.length > 16) {
        is_error = true;
        res.status(400).send({
            'message':'A name must be 3-16 characters.'
        });
        return;
    }
    var tries = build_tries(name);
    var found_names;
    for(i=0;i<tries.length;i++) {
        var url = `${link}${tries[i]}`;
        var name_s = tries[i];
        var en_url = encodeURI(url);
        axios.get(en_url)
            .then((response) => {
                if(response.data.exist == false) {
                    found_names = name_s;
                    return;
                }
            })
            .catch((err) => {
                is_error = true;
                res.status(429).send({
                    'message':'Please wait before trying again.'
                });
                return;
            });
    }
    setTimeout(function() {
        if(is_error) {
            return;
        }
        res.send({
            'found':found_names || 'none'
        });
    }, 2000);
});
