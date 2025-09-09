on("chat:message", function(msg) {
    // Exit if not an api command
    if (msg.type !== "api") {
        return;
    }

    const command = msg.content.split(" ");

    if (command[0] === '!delete_all'){
        const characters = findObjs({_type: "character"});
        characters.forEach((c) => c.remove());
    }

    if (command[0] === '!dcc-gen-char') {
        const count = !!command[1] ? command[1] : 1;
        for (i = 0; i < count; i++) {
            generateCharacter("Der ", dccTables.professions, dccTables.equipment, dccTables.specialEquipment, dccTables.fate);
        }
    }

    if (command[0] === '!dcc-gen-kansas') {
        const count = !!command[1] ? command[1] : 1;
        for (i = 0; i < count; i++) {
            generateCharacter("Ein(e) ", dccTables.kansasProfessions, dccTables.kansasEquipment, [], dccTables.kansasFate);
        }
    }
});

function generateCharacter(prefix, professions, equipment, specialEquipment, fateTable) {

    const highestRollValue = Math.max(...professions.map(p => Math.max(...p.roll)));
    const professionRoll = roll(highestRollValue);
    const matchingProfessions = [...professions.filter((e) => e.roll.includes(professionRoll))];
    const profession = _.sample(matchingProfessions);

    if (!profession || !profession.equipment) {
        log([highestRollValue, professionRoll, matchingProfessions]);
        return;
    }

    const modifier = {3: -3, 4: -2, 5: -2, 6: -1, 7: -1, 8: -1, 9: 0, 10: 0, 11: 0, 12: 0, 13: +1, 14: +1, 15: +1, 16: +2, 17: +2, 18: +3};

    const strength = roll(6, 3);
    const agility = roll(6, 3);
    const stamina = roll(6, 3);
    const personality = roll(6, 3);
    const intelligence = roll(6, 3);
    const luck = roll(6, 3);
    const hp = Math.max(roll(4) + modifier[stamina], 1);

    const maxFateKey = Math.max(...Object.keys(fateTable).map(k => parseInt(k)));
    const fateRoll = Math.min(Math.max(roll(maxFateKey) + modifier[luck], 1), maxFateKey);
    const fate = fateTable[fateRoll];

    let equipmentEntry = [
        _.sample(profession.equipment),
        _.sample(equipment),
    ].join('\n');
    if (specialEquipment.length > 0){
        equipmentEntry = equipmentEntry + '\n' + _.sample(specialEquipment);
    }

    if (!fate || !fate.name) {
        log([maxFateKey, fateRoll, fate, equipmentEntry]);
        return;
    }

    log(`${prefix}${profession.name} (${fate.name}) creating`);

    const character = createObj("character", {
        name: prefix + profession.name,
        inplayerjournals: "all",
        controlledby:     "all"
    });

    createObj("attribute", {name: "Occupation", current: profession.name, characterid: character.id});
    createObj("attribute", {name: "race", current: profession.race, characterid: character.id});
    createObj("attribute", {name: "HP", current: hp, max: hp, characterid: character.id});

    createObj("attribute", {name: "str", current: strength, characterid: character.id});
    createObj("attribute", {name: "strMax", current: strength, characterid: character.id});
    createObj("attribute", {name: "strMod", current: modifier[strength], characterid: character.id});

    createObj("attribute", {name: "agi", current: agility, characterid: character.id});
    createObj("attribute", {name: "agiMax", current: agility, characterid: character.id});
    createObj("attribute", {name: "agiMod", current: modifier[agility], characterid: character.id});

    createObj("attribute", {name: "sta", current: stamina, characterid: character.id});
    createObj("attribute", {name: "staMax", current: stamina, characterid: character.id});
    createObj("attribute", {name: "staMod", current: modifier[stamina], characterid: character.id});

    createObj("attribute", {name: "per", current: personality, characterid: character.id});
    createObj("attribute", {name: "perMax", current: personality, characterid: character.id});
    createObj("attribute", {name: "perMod", current: modifier[personality], characterid: character.id});

    createObj("attribute", {name: "int", current: intelligence, characterid: character.id});
    createObj("attribute", {name: "intMax", current: intelligence, characterid: character.id});
    createObj("attribute", {name: "intMod", current: modifier[intelligence], characterid: character.id});

    createObj("attribute", {name: "luck", current: luck, characterid: character.id});
    createObj("attribute", {name: "luckMax", current: luck, characterid: character.id});
    createObj("attribute", {name: "luckMod", current: modifier[luck], characterid: character.id});

    createObj("attribute", {name: "luckStarting", current: luck, characterid: character.id});
    createObj("attribute", {name: "luckStartingMod", current: modifier[luck], characterid: character.id});

    createObj("attribute", {name: "birthAugur", current: fate.name, characterid: character.id});
    createObj("attribute", {name: "luckyRoll", current: (modifier[luck] >= 0 ? '+' : '') + modifier[luck] + " auf " + fate.omen, characterid: character.id});

    createObj("attribute", {name: "Equipment", current: equipmentEntry, characterid: character.id});

    if (!!profession.weapon){
        if (!!profession.weapon.range){
            createObj("attribute", {name: "repeating_rangedweapon_001_rangedWeaponName", current: profession.weapon.name, characterid: character.id});
            createObj("attribute", {name: "repeating_rangedweapon_001_rangedDmg", current: profession.weapon.die, characterid: character.id});
            createObj("attribute", {name: "repeating_rangedweapon_001_rangedDistanceShort", current: profession.weapon.range, characterid: character.id});
            createObj("attribute", {name: "repeating_rangedweapon_001_rangedDistanceMed", current: profession.weapon.range * 2, characterid: character.id});
            createObj("attribute", {name: "repeating_rangedweapon_001_rangedDistanceLong", current: profession.weapon.range * 3, characterid: character.id});
            createObj("attribute", {name: "repeating_rangedweapon_001_rangedAttackEffectiveDice", current: "d20", characterid: character.id});
            if (fateRoll === 9){
                createObj("attribute", {name: "repeating_rangedweapon_001_zeroWeaponLuckyRoll", current: "@{luckStartingMod}", characterid: character.id});
            }
        } else {
            createObj("attribute", {name: "repeating_meleeweapon_001_meleeWeaponName", current: profession.weapon.name, characterid: character.id});
            createObj("attribute", {name: "repeating_meleeweapon_001_meleeDmg", current: profession.weapon.die, characterid: character.id});
            if (fateRoll === 9){
                createObj("attribute", {name: "repeating_meleeweapon_001_zeroWeaponLuckyRoll", current: "@{luckStartingMod}", characterid: character.id});
            }
        }
    }

    character.set("bio", '<ul>' + dccTables.traits.map((trait) => `<li>${trait.name}: ${trait.values.map((v) => _.sample(v)).join('-')}</li>`).join('') + '</ul>');
    log(prefix + profession.name + " done");
}

function roll(diceType, number = 1)
{
    let result = 0;
    for (let i=0; i<number; i++){
        result += randomInteger(diceType);
    }
    return result;
}

const dccTables = {
    professions: [
        {roll: [1], name: "Alchemist", race: "Mensch", weapon: {name: "Stab", die: "1d4"}, equipment: ["Öl, 1 Fläschchen"]},
        {roll: [2], name: "Tierbändiger", race: "Mensch", weapon: {name: "Knüppel", die: "1d4"}, equipment: ["Pony"]},
        {roll: [3], name: "Waffenschmied", race: "Mensch", weapon: {name: "Hammer (wie Knüppel)", die: "1d4"}, equipment: ["Eisenhelm"]},
        {roll: [4], name: "Astrologe", race: "Mensch", weapon: {name: "Dolch", die: "1d4"}, equipment: ["Fernrohr"]},
        {roll: [5], name: "Barbier", race: "Mensch", weapon: {name: "Rasierklinge (wie Dolch)", die: "1d4"}, equipment: ["Schere"]},
        {roll: [6], name: "Büttel", race: "Mensch", weapon: {name: "Stab", die: "1d4"}, equipment: ["Heiliges Symbol"]},
        {roll: [7], name: "Imker", race: "Mensch", weapon: {name: "Stab", die: "1d4"}, equipment: ["Honigtopf"]},
        {roll: [8], name: "Schmied", race: "Mensch", weapon: {name: "Hammer (wie Knüppel)", die: "1d4"}, equipment: ["Stahlzange"]},
        {roll: [9], name: "Metzger", race: "Mensch", weapon: {name: "Hackbeil (wie Axt)", die: "1d6"}, equipment: ["1 Stück Rindfleisch"]},
        {roll: [10], name: "Karawanenwache", race: "Mensch", weapon: {name: "Kurzschwert", die: "1d6"}, equipment: ["Leinen, 1 m"]},
        {roll: [11], name: "Käser", race: "Mensch", weapon: {name: "Schlagstock (wie Stab)", die: "1d4"}, equipment: ["Stinkender Käse"]},
        {roll: [12], name: "Schuster", race: "Mensch", weapon: {name: "Ahle (wie Dolch)", die: "1d4"}, equipment: ["Schuhlöffel"]},
        {roll: [13], name: "Betrüger", race: "Mensch", weapon: {name: "Dolch", die: "1d4"}, equipment: ["Hochwertiger Mantel"]},
        {roll: [14], name: "Böttcher", race: "Mensch", weapon: {name: "Brechstange (wie Knüppel)", die: "1d4"}, equipment: ["Fass"]},
        {roll: [15], name: "Straßenhändler", race: "Mensch", weapon: {name: "Messer (wie Dolch)", die: "1d4"}, equipment: ["Früchte"]},
        {roll: [16], name: "Taschendieb", race: "Mensch", weapon: {name: "Dolch", die: "1d4"}, equipment: ["Kleine Kiste"]},
        {roll: [17], name: "Grabengräber", race: "Mensch", weapon: {name: "Schaufel (wie Stab)", die: "1d4"}, equipment: ["Feine Erde, 0,5 kg"]},
        {roll: [18], name: "Hafenarbeiter", race: "Mensch", weapon: {name: "Stange (wie Stab)", die: "1d4"}, equipment: ["ein verspätetes Rollenspielbuch"]},
        {roll: [19], name: "Zwergischer Apotheker", race: "Zwerg", weapon: {name: "Schlagstock (wie Stab)", die: "1d4"}, equipment: ["Stahlphiole"]},
        {roll: [20], name: "Zwergischer Schmied", race: "Zwerg", weapon: {name: "Hammer (wie Knüppel)", die: "1d4"}, equipment: ["Mithril, 30 g"]},
        {roll: [21], name: "Zwergischer Kistenmacher", race: "Zwerg", weapon: {name: "Meißel (wie Dolch)", die: "1d4"}, equipment: ["Holz, 5 kg"]},
        {roll: [22], name: "Zwergischer Hirte", race: "Zwerg", weapon: {name: "Stab", die: "1d4"}, equipment: ["Sau**"]},
        {roll: [23, 24], name: "Zwergischer Minenarbeiter", race: "Zwerg", weapon: {name: "Hacke (wie Knüppel)", die: "1d4"}, equipment: ["Laterne"]},
        {roll: [25], name: "Zwergischer Pilzzüchter", race: "Zwerg", weapon: {name: "Schaufel (wie Stab)", die: "1d4"}, equipment: ["Sack"]},
        {roll: [26], name: "Zwergischer Rattenfänger", race: "Zwerg", weapon: {name: "Knüppel", die: "1d4"}, equipment: ["Netz"]},
        {roll: [27, 28], name: "Zwergischer Steinmetz", race: "Zwerg", weapon: {name: "Hammer", die: "1d4"}, equipment: ["schöner Stein, 5 kg"]},
        {roll: [29], name: "Elfischer Kunsthandwerker", race: "Elf", weapon: {name: "Stab", die: "1d4"}, equipment: ["Ton, 0,5 kg"]},
        {roll: [30], name: "Elfischer Advokat", race: "Elf", weapon: {name: "Schreibfeder (wie Wurfpfeil)", die: "1d4", range: 6}, equipment: ["Buch"]},
        {roll: [31], name: "Elfischer Kerzenmacher", race: "Elf", weapon: {name: "Schere (wie Dolch)", die: "1d4"}, equipment: ["Kerzen, 20"]},
        {roll: [32], name: "Elfischer Falkner", race: "Elf", weapon: {name: "Dolch", die: "1d4"}, equipment: ["Falke"]},
        {roll: [33, 34], name: "Elfischer Förster", race: "Elf", weapon: {name: "Stab", die: "1d4"}, equipment: ["Kräuter, 0,5 kg"]},
        {roll: [35], name: "Elfischer Glasbläser", race: "Elf", weapon: {name: "Hammer (wie Knüppel)", die: "1d4"}, equipment: ["Glasperlen"]},
        {roll: [36], name: "Elfischer Navigator", race: "Elf", weapon: {name: "Kurzbogen", die: "1d6", range: 15}, equipment: ["Fernrohr"]},
        {roll: [37, 38], name: "Elfischer Gelehrter", race: "Elf", weapon: {name: "Dolch", die: "1d4"}, equipment: ["Pergament und Schreibfeder"]},
        {roll: [39], name: "Bauer", race: "Mensch", weapon: {name: "Mistgabel (wie Speer)", die: "1d8"}, equipment: ["Henne", "Henne", "Henne", "Henne", "Henne", "Henne", "Schaf", "Ziege", "Rind", "Ente", "Gans", "Esel"]},
        {roll: [40], name: "Kartoffelbauer", race: "Mensch", weapon: {name: "Mistgabel (wie Speer)", die: "1d8"}, equipment: ["Henne", "Henne", "Henne", "Henne", "Henne", "Henne", "Schaf", "Ziege", "Rind", "Ente", "Gans", "Esel"]},
        {roll: [41], name: "Weizenbauer", race: "Mensch", weapon: {name: "Mistgabel (wie Speer)", die: "1d8"}, equipment: ["Henne", "Henne", "Henne", "Henne", "Henne", "Henne", "Schaf", "Ziege", "Rind", "Ente", "Gans", "Esel"]},
        {roll: [42], name: "Rübenbauer", race: "Mensch", weapon: {name: "Mistgabel (wie Speer)", die: "1d8"}, equipment: ["Henne", "Henne", "Henne", "Henne", "Henne", "Henne", "Schaf", "Ziege", "Rind", "Ente", "Gans", "Esel"]},
        {roll: [43], name: "Maisbauer", race: "Mensch", weapon: {name: "Mistgabel (wie Speer)", die: "1d8"}, equipment: ["Henne", "Henne", "Henne", "Henne", "Henne", "Henne", "Schaf", "Ziege", "Rind", "Ente", "Gans", "Esel"]},
        {roll: [44], name: "Reisbauer", race: "Mensch", weapon: {name: "Mistgabel (wie Speer)", die: "1d8"}, equipment: ["Henne", "Henne", "Henne", "Henne", "Henne", "Henne", "Schaf", "Ziege", "Rind", "Ente", "Gans", "Esel"]},
        {roll: [45], name: "Pastinakenbauer", race: "Mensch", weapon: {name: "Mistgabel (wie Speer)", die: "1d8"}, equipment: ["Henne", "Henne", "Henne", "Henne", "Henne", "Henne", "Schaf", "Ziege", "Rind", "Ente", "Gans", "Esel"]},
        {roll: [46], name: "Rettichbauer", race: "Mensch", weapon: {name: "Mistgabel (wie Speer)", die: "1d8"}, equipment: ["Henne", "Henne", "Henne", "Henne", "Henne", "Henne", "Schaf", "Ziege", "Rind", "Ente", "Gans", "Esel"]},
        {roll: [47], name: "Steckrübenbauer", race: "Mensch", weapon: {name: "Mistgabel (wie Speer)", die: "1d8"}, equipment: ["Henne", "Henne", "Henne", "Henne", "Henne", "Henne", "Schaf", "Ziege", "Rind", "Ente", "Gans", "Esel"]},
        {roll: [48], name: "Wahrsager", race: "Mensch", weapon: {name: "Dolch", die: "1d4"}, equipment: ["Tarotkarten"]},
        {roll: [49], name: "Glücksspieler", race: "Mensch", weapon: {name: "Knüppel", die: "1d4"}, equipment: ["Würfel"]},
        {roll: [50], name: "Buttenmann/-frau", race: "Mensch", weapon: {name: "Handschaufel (wie Dolch)", die: "1d4"}, equipment: ["Sack gesammelter Notdurft"]},
        {roll: [51, 52], name: "Totengräber", race: "Mensch", weapon: {name: "Schaufel (wie Stab)", die: "1d4"}, equipment: ["Handschaufel"]},
        {roll: [53, 54], name: "Gildenbettler", race: "Mensch", weapon: {name: "Schleuder", die: "1d4", range: 12}, equipment: ["Krücken"]},
        {roll: [55], name: "Halblinghühnermetzger", race: "Halbling", weapon: {name: "Handaxt", die: "1d4"}, equipment: ["Hühnchenfleisch, 2,5 kg"]},
        {roll: [56, 57], name: "Halblingfärber", race: "Halbling", weapon: {name: "Stab", die: "1d4"}, equipment: ["Stoff, 3 m"]},
        {roll: [58], name: "Halblinghandschuhmacher", race: "Halbling", weapon: {name: "Ahle (wie Dolch)", die: "1d4"}, equipment: ["Handschuhe, 4 Paar"]},
        {roll: [59], name: "Halbling vom Fahrenden Volk", race: "Halbling", weapon: {name: "Schleuder", die: "1d4", range: 12}, equipment: ["Zauberpuppe"]},
        {roll: [60], name: "Halblingkurzwarenhändler", race: "Halbling", weapon: {name: "Schere (wie Dolch)", die: "1d4"}, equipment: ["Feine Herrenkleidung, 3 Garnituren"]},
        {roll: [61], name: "Halblingseemann", race: "Halbling", weapon: {name: "Messer (wie Dolch)", die: "1d4"}, equipment: ["Segeltuch, 2 m"]},
        {roll: [62], name: "Halblinggeldverleiher", race: "Halbling", weapon: {name: "Kurzschwert", die: "1d6"}, equipment: ["5 GM, 10 SM, 200 KM"]},
        {roll: [63], name: "Halblinghändler", race: "Halbling", weapon: {name: "Kurzschwert", die: "1d6"}, equipment: ["20 SM"]},
        {roll: [64], name: "Halblinglandstreicher", race: "Halbling", weapon: {name: "Knüppel", die: "1d4"}, equipment: ["Bettelschale"]},
        {roll: [65], name: "Heiler", race: "Mensch", weapon: {name: "Knüppel", die: "1d4"}, equipment: ["Heiliges Wasser, 1 Fläschchen"]},
        {roll: [66], name: "Kräuterkundler", race: "Mensch", weapon: {name: "Knüppel", die: "1d4"}, equipment: ["Kräuter, 0,5 kg"]},
        {roll: [67], name: "Hirte", race: "Mensch", weapon: {name: "Stab", die: "1d4"}, equipment: ["Schäferhund**"]},
        {roll: [68, 69], name: "Jäger", race: "Mensch", weapon: {name: "Kurzbogen", die: "1d4", range: 15}, equipment: ["Hirschfell"]},
        {roll: [70], name: "Vertragsknecht", race: "Mensch", weapon: {name: "Stab", die: "1d4"}, equipment: ["Medaillon"]},
        {roll: [71], name: "Narr", race: "Mensch", weapon: {name: "Wurfpfeil", die: "1d4", range: 6}, equipment: ["Seidenkleidung"]},
        {roll: [72], name: "Juwelier", race: "Mensch", weapon: {name: "Dolch", die: "1d4"}, equipment: ["Edelstein, 20 GM wert"]},
        {roll: [73], name: "Schlosser", race: "Mensch", weapon: {name: "Dolch", die: "1d4"}, equipment: ["Feinwerkzeug"]},
        {roll: [74], name: "Bettler", race: "Mensch", weapon: {name: "Knüppel", die: "1d4"}, equipment: ["Käsesoße"]},
        {roll: [75], name: "Söldner", race: "Mensch", weapon: {name: "Langschwert", die: "1d8"}, equipment: ["Fellrüstung"]},
        {roll: [76], name: "Kaufmann", race: "Mensch", weapon: {name: "Dolch", die: "1d4"}, equipment: ["4 GM, 14 SM, 27 KM"]},
        {roll: [77], name: "Müller/Bäcker", race: "Mensch", weapon: {name: "Knüppel", die: "1d4"}, equipment: ["Mehl, 0,5 kg"]},
        {roll: [78], name: "Barde", race: "Mensch", weapon: {name: "Dolch", die: "1d4"}, equipment: ["Ukulele"]},
        {roll: [79], name: "Adeliger", race: "Mensch", weapon: {name: "Langschwert", die: "1d8"}, equipment: ["Goldring, 10 GM wert"]},
        {roll: [80], name: "Waise", race: "Mensch", weapon: {name: "Knüppel", die: "1d4"}, equipment: ["Stoffpuppe"]},
        {roll: [81], name: "Stallknecht", race: "Mensch", weapon: {name: "Stab", die: "1d4"}, equipment: ["Zaumzeug"]},
        {roll: [82], name: "Gesetzloser", race: "Mensch", weapon: {name: "Kurzschwert", die: "1d6"}, equipment: ["Lederrüstung"]},
        {roll: [83], name: "Seiler", race: "Mensch", weapon: {name: "Messer (wie Dolch)", die: "1d4"}, equipment: ["Seil, 30 m"]},
        {roll: [84], name: "Schreiber", race: "Mensch", weapon: {name: "Wurfpfeil", die: "1d4", range: 6}, equipment: ["Pergament, 10 Blätter"]},
        {roll: [85], name: "Schamane", race: "Mensch", weapon: {name: "Streitkolben", die: "1d6"}, equipment: ["Kräuter, 0,5 kg"]},
        {roll: [86], name: "Sklave", race: "Mensch", weapon: {name: "Knüppel", die: "1d4"}, equipment: ["Seltsam aussehender Stein"]},
        {roll: [87], name: "Schmuggler", race: "Mensch", weapon: {name: "Schleuder", die: "1d4", range: 12}, equipment: ["Wasserdichter Sack"]},
        {roll: [88], name: "Soldat", race: "Mensch", weapon: {name: "Speer", die: "1d8"}, equipment: ["Schild"]},
        {roll: [89, 90], name: "Knappe", race: "Mensch", weapon: {name: "Langschwert", die: "1d8"}, equipment: ["Stahlhelm"]},
        {roll: [91], name: "Steuereintreiber", race: "Mensch", weapon: {name: "Langschwert", die: "1d8"}, equipment: ["100 KM"]},
        {roll: [92, 93], name: "Fallensteller", race: "Mensch", weapon: {name: "Schleuder", die: "1d4", range: 12}, equipment: ["Dachsfell"]},
        {roll: [94], name: "Gassenkind", race: "Mensch", weapon: {name: "Stock (wie Knüppel)", die: "1d4"}, equipment: ["Bettelschale"]},
        {roll: [95], name: "Wagner", race: "Mensch", weapon: {name: "Knüppel", die: "1d4"}, equipment: ["Schubkarre voll mit Tomaten", "leere Schubkarre", "Schubkarre voll mit Stroh", "Schubkarre voll mit euren Toten", "Schubkarre voll mit Erde", "Schubkarre voll mit Steinen"]},
        {roll: [96], name: "Weber", race: "Mensch", weapon: {name: "Dolch", die: "1d4"}, equipment: ["Feine Kleidung"]},
        {roll: [97], name: "Zauberlehrling", race: "Mensch", weapon: {name: "Dolch", die: "1d4"}, equipment: ["Schwarzes Zauberbuch"]},
        {roll: [98, 99, 100], name: "Holzfäller", race: "Mensch", weapon: {name: "Handaxt", die: "1d6"}, equipment: ["Bündel Holz"]},
    ],
    kansasProfessions: [
        {roll: [1], name: "Buchhalter(in)", race: "Mensch", weapon: null, equipment: ["Taschenrechner1, Kassenbuch"]},
        {roll: [2], name: "Schauspieler(in)", race: "Mensch", weapon: null, equipment: ["Feuerzeug, Schachtel Zigaretten"]},
        {roll: [3], name: "Verkehrspilot(in)", race: "Mensch", weapon: null, equipment: ["Reisekoffer, Wäsche zum (1W4 mal) Wechseln"]},
        {roll: [4], name: "Tierfänger(in)", race: "Mensch", weapon: null, equipment: ["Fangschlinge, kleiner Käfig"]},
        {roll: [5], name: "bildender Künstler(in)", race: "Mensch", weapon: {name: "Meißel für Bildhauerei (als Dolch)", die: "1d4"}, equipment: ["Farbtube"]},
        {roll: [6, 7, 8], name: "Sportler(in) (Baseball)", race: "Mensch", weapon: {name: "Baseballschläger (als Knüppel)", die: "1d4"}, equipment: ["Fanghandschuh"]},
        {roll: [6, 7, 8], name: "Sportler(in) (Baseball)", race: "Mensch", weapon: {name: "Baseballschläger (als Knüppel)", die: "1d4"}, equipment: ["Fanghandschuh"]},
        {roll: [6, 7, 8], name: "Sportler(in) (Football)", race: "Mensch", weapon: null, equipment: ["Helm (RK +1), Football"]},
        {roll: [6, 7, 8], name: "Sportler(in) (Football)", race: "Mensch", weapon: null, equipment: ["Helm (RK +1), Football"]},
        {roll: [6, 7, 8], name: "Sportler(in) (Basketball)", race: "Mensch", weapon: null, equipment: ["Basketball, Schweißbänder"]},
        {roll: [6, 7, 8], name: "Sportler(in) (Basketball)", race: "Mensch", weapon: null, equipment: ["Basketball, Schweißbänder"]},
        {roll: [6, 7, 8], name: "Sportler(in) (Tennis)", race: "Mensch", weapon: null, equipment: ["Tennisschläger, 1W3 Tennisbälle"]},
        {roll: [6, 7, 8], name: "Sportler(in) (Eishockey)", race: "Mensch", weapon: {name: "Eishockeyschläger (als Knüppel)", die: "1d4"}, equipment: ["Schlittschuhe"]},
        {roll: [9], name: "Obdachlose(r)", race: "Mensch", weapon: null, equipment: ["Einkaufswagen, 2W6 Einkaufstüten"]},
        {roll: [10], name: "Bäcker(in)", race: "Mensch", weapon: {name: "Teigrolle (als Knüppel)", die: "1d4"}, equipment: ["kleiner Mehlsack"]},
        {roll: [11], name: "Barbier(in)", race: "Mensch", weapon: {name: "Schere (als Dolch)", die: "1d4"}, equipment: ["Rasierschaum"]},
        {roll: [12], name: "Imker(in)", race: "Mensch", weapon: null, equipment: ["Imkerhut, Glas voll Honig"]},
        {roll: [13], name: "Bierbrauer(in)", race: "Mensch", weapon: null, equipment: ["Sechserpack Bier, Säckchen mit Bierhefe"]},
        {roll: [14], name: "Maurer(in)", race: "Mensch", weapon: {name: "Kelle (als Dolch)", die: "1d4"}, equipment: ["1W6 Bauziegel"]},
        {roll: [15], name: "Einbrecher(in)", race: "Mensch", weapon: {name: "Brechstange (als Knüppel)", die: "1d4"}, equipment: ["Skimaske"]},
        {roll: [16], name: "Metzger(in)", race: "Mensch", weapon: {name: "Fleischerbeil (als Handaxt)", die: "1d4"}, equipment: ["1 Pfund rohes Fleisch"]},
        {roll: [17], name: "Busfahrer(in)", race: "Mensch", weapon: null, equipment: ["Bus, Thermosflasche voller Kaffee"]},
        {roll: [18], name: "Gebrauchtwagenhändler(in)", race: "Mensch", weapon: null, equipment: ["Schlüsselbund mit 2W7 Schlüsseln, Toupet bzw. Perücke"]},
        {roll: [19], name: "Zimmermann(in)", race: "Mensch", weapon: {name: "Hammer (als Knüppel)", die: "1d4"}, equipment: ["2W12 Nägel"]},
        {roll: [20], name: "Koch/Köchin", race: "Mensch", weapon: {name: "Bratpfanne (als Knüppel)", die: "1d4"}, equipment: ["2W4 Gewürze"]},
        {roll: [21], name: "Clown(in)", race: "Mensch", weapon: null, equipment: ["quietschende Gumminase, Handschocker"]},
        {roll: [22], name: "Programmierer(in)", race: "Mensch", weapon: null, equipment: ["Rechenschieber, Stapel von Lochkarten"]},
        {roll: [23], name: "Süßigkeitenverkäufer(in)", race: "Mensch", weapon: null, equipment: ["Tüte mit Karamellbonbons, 1W6 große Lutscher"]},
        {roll: [24, 25, 26], name: "Bauarbeiter(in)", race: "Mensch", weapon: {name: "Vorschlaghammer (als Kriegshammer)", die: "1d6"}, equipment: ["Helm (RK +1)"]},
        {roll: [27], name: "Milchbauer(in)", race: "Mensch", weapon: null, equipment: ["Eimer, 1 Pfund Quark oder Käse"]},
        {roll: [28], name: "Zahnarzt/Zahnärztin", race: "Mensch", weapon: null, equipment: ["Dentalküretten, Tube mit Zahnpasta"]},
        {roll: [29], name: "Arzt/Ärztin", race: "Mensch", weapon: null, equipment: ["Stethoskop, Glasbehälter mit einem verschreibungspflichtigen Medikament"]},
        {roll: [30], name: "Hundetrainer(in)", race: "Mensch", weapon: null, equipment: ["1W14 kleine Leckereien für Hunde, Hund (klein, aber bösartig)"]},
        {roll: [31], name: "Elektriker(in)", race: "Mensch", weapon: null, equipment: ["Spule mit Kupferdraht, Schraubenzieher"]},
        {roll: [32], name: "Revuetänzer(in)", race: "Mensch", weapon: null, equipment: ["Federboa, Etui mit Makeup"]},
        {roll: [33, 34], name: "Landwirt(in)", race: "Mensch", weapon: {name: "Heugabel (als Speer)", die: "1d6"}, equipment: ["Huhn"]},
        {roll: [35], name: "Fischer(in)", race: "Mensch", weapon: {name: "Fischputzmesser (als Dolch)", die: "1d4"}, equipment: ["Netz"]},
        {roll: [36], name: "Feuerwehrmann/-frau", race: "Mensch", weapon: {name: "Feueraxt (als Streitaxt)", die: "1d6"}, equipment: ["feuerfester Mantel"]},
        {roll: [37], name: "Fitnesstrainer(in)", race: "Mensch", weapon: {name: "Hantel (als Knüppel)", die: "1d4"}, equipment: ["Schweißbänder"]},
        {roll: [38], name: "Glücksspieler(in)", race: "Mensch", weapon: null, equipment: ["gezinktes Kartenspiel, dunkle Sonnenbrille"]},
        {roll: [39], name: "Spieldesigner(in)", race: "Mensch", weapon: null, equipment: ["Beutel mit Polyeder-Würfeln, Block mit Zeichenpapier"]},
        {roll: [40], name: "Mitglied einer Straßenbande", race: "Mensch", weapon: {name: "Messer (als Dolch)", die: "1d4"}, equipment: ["1,50 m lange Kette"]},
        {roll: [41], name: "Müllwerker(in)", race: "Mensch", weapon: null, equipment: ["Mülltonnendeckel (als Schild), Sack voll Müll"]},
        {roll: [42], name: "Tankwart(in)", race: "Mensch", weapon: null, equipment: ["Scheibenreiniger, Dose Kautabak"]},
        {roll: [43], name: "Platzwart(in)", race: "Mensch", weapon: {name: "Rechen (als Stab)", die: "1d4"}, equipment: ["Dose Unkrautvernichtungsmittel"]},
        {roll: [44], name: "Lehrer(in)", race: "Mensch", weapon: null, equipment: ["Lineal, Schachtel voll Kreide"]},
        {roll: [45], name: "Hausfrau/-mann", race: "Mensch", weapon: null, equipment: ["bequemer Hausmantel, Korb voll schmutziger Wäsche"]},
        {roll: [46], name: "Jäger(in)", race: "Mensch", weapon: {name: "Bogen (als Kurzbogen)", die: "1d6", range: 15}, equipment: ["Hirschfell"]},
        {roll: [47], name: "reiche(r) Nichtstuer(in)", race: "Mensch", weapon: null, equipment: ["goldener Ring, teure Armbanduhr"]},
        {roll: [48, 49], name: "Industriemaschinenführer(in)", race: "Mensch", weapon: null, equipment: ["Helm (RK +1), Schutzbrille"]},
        {roll: [50], name: "Hausmeister(in)", race: "Mensch", weapon: {name: "Besen (als Stab)", die: "1d4"}, equipment: ["Eimer"]},
        {roll: [51], name: "Juwelier(in)", race: "Mensch", weapon: null, equipment: ["Lupe, Edelstein im Wert von 20 GM"]},
        {roll: [52], name: "Anwalt/Anwältin", race: "Mensch", weapon: null, equipment: ["Aktenkoffer, 1W6 angeberische Füllfederhalter"]},
        {roll: [53], name: "Rettungsschwimmer(in)", race: "Mensch", weapon: null, equipment: ["Schwimmbrille, Trillerpfeife"]},
        {roll: [54], name: "Briefträger(in)", race: "Mensch", weapon: null, equipment: ["Tasche voller Post, Hundespray"]},
        {roll: [55], name: "Mechaniker(in)", race: "Mensch", weapon: {name: "Schraubenschlüssel (als Knüppel)", die: "1d4"}, equipment: ["Dose Schmierfett"]},
        {roll: [56], name: "Pantomime/Pantomimin", race: "Mensch", weapon: null, equipment: ["imaginäres Seil, imaginäre Kiste"]},
        {roll: [57], name: "Bergmann/-frau", race: "Mensch", weapon: {name: "Spitzhacke (als Handaxt)", die: "1d4"}, equipment: ["Helm mit Leuchte"]},
        {roll: [58], name: "Geistliche(r)", race: "Mensch", weapon: null, equipment: ["heiliges Buch, silbernes Glaubenssymbol"]},
        {roll: [59], name: "Bestatter(in)", race: "Mensch", weapon: null, equipment: ["Knochensäge, Fläschchen mit Totenbalsam"]},
        {roll: [60], name: "Motorrad-Streifenpolizist(in)", race: "Mensch", weapon: null, equipment: ["Helm (RK +1), Handschellen"]},
        {roll: [61, 62], name: "Musiker(in)", race: "Mensch", weapon: null, equipment: ["Musikinstrument, Schachtel Zigaretten"]},
        {roll: [63], name: "New Age-Guru", race: "Mensch", weapon: null, equipment: ["2W12 Räucherstäbchen, 1W7 Kristalle"]},
        {roll: [64], name: "Angestellte(r) im Kernkraftwerk", race: "Mensch", weapon: {name: "Seelenloser Stahlbolzen (als Knüppel)", die: "1d4"}, equipment: ["Greifzange für Brennelemente"]},
        {roll: [65], name: "Krankenpfleger(in)", race: "Mensch", weapon: null, equipment: ["Verbandsmaterial, Pillenfläschchen mit Aspirin"]},
        {roll: [66], name: "Bettler(in)", race: "Mensch", weapon: null, equipment: ["Dose mit 2W20 KM, abgeschossene Decke"]},
        {roll: [67], name: "Wildhüter(in)", race: "Mensch", weapon: null, equipment: ["Wanderstab, Kompass"]},
        {roll: [68], name: "Fotograf(in)", race: "Mensch", weapon: null, equipment: ["Fotoapparat, Flasche mit Entwicklerflüssigkeit"]},
        {roll: [69], name: "Klempner(in)", race: "Mensch", weapon: {name: "Bleirohr (als Knüppel)", die: "1d4"}, equipment: ["Pümpel"]},
        {roll: [70], name: "Kripobeamte(r)", race: "Mensch", weapon: {name: "Revolver", die: "1d6"}, equipment: ["Handschellen"]},
        {roll: [71], name: "Psychiater(in)", race: "Mensch", weapon: null, equipment: ["Karten mit Bildern für Rorschach-Test, Tabakspfeife"]},
        {roll: [72], name: "Radio-DJ", race: "Mensch", weapon: null, equipment: ["Kopfhörer, 1W6 Schallplatten"]},
        {roll: [73, 74, 75, 76], name: "Verkäufer(in) im Buchladen", race: "Mensch", weapon: null, equipment: ["1W3 Bücher, 2W4 Zeitschriften"]},
        {roll: [73, 74, 75, 76], name: "Verkäufer(in) im Bekleidungsgeschäft", race: "Mensch", weapon: null, equipment: ["1W6 schicke Hemden oder Blusen, Ledergürtel"]},
        {roll: [73, 74, 75, 76], name: "Verkäufer(in) im Lebensmittelgeschäft", race: "Mensch", weapon: null, equipment: ["Schachtel Cornflakes, 1W4 Dosensuppen"]},
        {roll: [73, 74, 75, 76], name: "Verkäufer(in) im Eisenwarenhandlung", race: "Mensch", weapon: null, equipment: ["Handsäge, 6m Nylonseil"]},
        {roll: [73, 74, 75, 76], name: "Verkäufer(in) im Bastelladen", race: "Mensch", weapon: null, equipment: ["ferngesteuertes Auto, 2W6 Zinnminiaturen"]},
        {roll: [73, 74, 75, 76], name: "Verkäufer(in) im Plattenladen", race: "Mensch", weapon: null, equipment: ["2W4 Schallplatten, Flachmann mit Schnaps"]},
        {roll: [73, 74, 75, 76], name: "Verkäufer(in) im Spielwarenladen", race: "Mensch", weapon: null, equipment: ["Barbiepuppe, Spritzpistole"]},
        {roll: [77], name: "Wissenschaftler(in) für Archäologie", race: "Mensch", weapon: {name: "Handschaufel (als Dolch)", die: "1d4"}, equipment: ["Götzendarstellung aus Bronze"]},
        {roll: [77], name: "Wissenschaftler(in) für Astronomie", race: "Mensch", weapon: null, equipment: ["kleines Teleskop, Sternenkarte"]},
        {roll: [77], name: "Wissenschaftler(in) für Chemie", race: "Mensch", weapon: null, equipment: ["Schutzbrille, kleiner Behälter mit Säure"]},
        {roll: [77], name: "Wissenschaftler(in) für Entomologie", race: "Mensch", weapon: null, equipment: ["Insektenglas, ungewöhnlich großer Käfer"]},
        {roll: [77], name: "Wissenschaftler(in) für Geologie", race: "Mensch", weapon:  {name: "kleine Hacke (als Knüppel)", die: "1d4"}, equipment: ["2W10 interessante Steine"]},
        {roll: [78, 79], name: "Bürokraft", race: "Mensch", weapon: null, equipment: ["Hefter, Packung Kaugummi"]},
        {roll: [80], name: "Lkw-Fahrer(in)", race: "Mensch", weapon: null, equipment: ["Thermosflasche mit Kaffee, 1W8 8-Spur-Kassetten"]},
        {roll: [81], name: "Flickschuster(in)", race: "Mensch", weapon: {name: "Sattlermesser (als Dolch)", die: "1d4"}, equipment: ["1W4 Paare schadhafte Schuhe"]},
        {roll: [82], name: "Soldat(in)", race: "Mensch", weapon: {name: "Gewehr", die: "1d8", range: 15}, equipment: ["Feldflasche mit Wasser"]},
        {roll: [83], name: "Stallhilfe", race: "Mensch", weapon: null, equipment: ["Kardätsche, gefüllter Hafersack"]},
        {roll: [84, 85, 86], name: "Student(in)", race: "Mensch", weapon: null, equipment: ["Rucksack, 1W5 Fachbücher"]},
        {roll: [87], name: "Stuntman/-woman", race: "Mensch", weapon: {name: "Requisitenschwert (als Knüppel)", die: "1d4"}, equipment: ["gepolsterter Helm (RK +1)"]},
        {roll: [88], name: "Vermesser(in)", race: "Mensch", weapon: null, equipment: ["Theodolit, Klappzollstock (2 m)"]},
        {roll: [89], name: "Schneider(in)", race: "Mensch", weapon: {name: "Schere (als Dolch)", die: "1d4"}, equipment: ["Rolle Stoff"]},
        {roll: [90], name: "Taxifahrer(in)", race: "Mensch", weapon: {name: "Reifenheber (als Knüppel)", die: "1d4"}, equipment: ["Stadtplan"]},
        {roll: [91], name: "Tierpräparator(in)", race: "Mensch", weapon: {name: "Ledermesser (als Dolch)", die: "1d4"}, equipment: ["1W4 tote Vögel"]},
        {roll: [92], name: "Reisekaufmann/-frau", race: "Mensch", weapon: null, equipment: ["Aktenkoffer, Mitbringsel von einem bevorzugten Reiseziel"]},
        {roll: [93], name: "Fernsehreporter(in)", race: "Mensch", weapon: null, equipment: ["Mikrofon, 9 m Kabel"]},
        {roll: [94, 95], name: "Kellner(in)", race: "Mensch", weapon: {name: "Steakmesser (als Dolch)", die: "1d4"}, equipment: ["Flasche Wein"]},
        {roll: [96], name: "Schweißer(in)", race: "Mensch", weapon: {name: "Moniereisen (als Knüppel)", die: "1d4"}, equipment: ["Schweißhelm (RK +1)"]},
        {roll: [97], name: "Zoowärter(in)", race: "Mensch", weapon: {name: "Schaufel (als Knüppel)", die: "1d4"}, equipment: ["Eimer voll Elefantenmist"]},
    ],
    equipment: [
        "Brecheisen", "Diebeswerkzeug", "Eisennägel", "Fackel", "Feuerstein und Stahl", "Fläschchen, leer",
        "Hammer, klein", "Heiliges Symbol", "Kerze", "Kette, 3 m", "Kletterhaken", "Kreide, 1 Stück",
        "Laterne", "Öl, 1 Fläschchen (1d6 Brandschaden pro Runde)", "Ration", "Rucksack", "Sack, groß", "Sack, klein",
        "Seil, 15 m", "Handspiegel", "Stange, 3 m", "Truhe, leer", "Weihwasser, 1 Phiole (1d4 Schaden gegen Untote und Teufel)", "Wasserschlauch"
    ],
    kansasEquipment: [
        "Rucksack", "Handtasche", "Kugelschreiber", "Schlagring (waffenloser Kampf +1 Schaden)",
        "Kamm", "Haarbürste", "Diamantring im Wert von 20 GM", "Brille",
        "Taschenlampe", "Trinkflasche, leer", "Klappmesser (als Dolch)",
        "Heiliges Symbol", "Schlüsselbund mit 1W5 Schlüsseln", "Feuerzeug",
        "Lippenstift oder Haaröl", "Hasenpfote als Glücksbringer", "kleiner Schminkspiegel",
        "Notizblock", "Päckchen Kaugummi", "Päckchen Zigaretten",
        "Taschenbuch", "Rollschuhe", "Sonnenbrille",
        "Regenschirm", "Armbanduhr", "Jo-jo",
    ],
    specialEquipment: [
        "Kleiner Hamster, der noch einen Namen braucht", "1d20 Murmeln",
        "Dose Würmer zum Angeln", "Holzkeil", "Blockflöte", "Flagge mit dem Dorfwappen",
        "Eine Goldmünze, versteckt im Stiefelabsatz", "Ungeöffneter Brief", "Beutel mit guten Teeblättern",
        "Kleiner Spiegel", "Leere Flasche", "Beutel Zucker", "Kreisel", "Gute Pfeife",
        "Säckchen mit 2d100 Bohnen (1 Bohne ist magisch)", "Stück Kreide", "Zinnkrug", "Stück Seife",
        "2W6 Nägel", "Ehering der Großmutter", "Kleines Holzpferdchen", "Kerze",
        "Tintenfass mit grüner Tinte", "Geräuchertes Schinkenstück", "Beutel Pfeifenkraut", "Gezinkter Würfel",
        "Siegelwachs", "Gute Flasche Wein", "2d6 Kerzendochte", "Siegelring", "Rolle Nähgarn", "Meißel",
        "Hübscher Kieselstein", "Holzschüssel und Holzlöffel", "Lederschürze (kein Rüstungswert)",
        "Kräutersalbe gegen Warzen", "Küchenkräuter", "Eisentopf", "Ziernadel für den Umhang",
        "Haarspange aus Silber (Wert: 1d6 SM)", "4d6 Pfefferkörner", "Safran (Wert: 1d6 GM)",
        "Rezeptbuch einer Kräuterhexe", "1d8 Nägel", "Altes Kartenspiel mit seltsamen Bildern (eine Karte fehlt)",
        "Freundliche, kleine Katze", "Verflucht modischer Hut", "Brieftaube mit drei Zehen", "Marmelade aus dem letzten Sommer",
        "Rucksack", "Hühnerei", "Feuerholzbündel", "Nervige Triangel", "Eine Marionette, die aussieht wie einer deiner Gefährten",
        "Ein Glas voller Glühwürmchen", "Beutel Teeblätter", "Seil und Enterhaken", "Heringe und Hammer", "Zelt für eine Person",
        "Glöckchen", "Schuppe einer Meerjungfrau (wurde dir zumindest gesagt)", "Schachtel mit einem seltsamen, grünen Käfer",
        "Grüner Leuchtkristall", "Die in rotes Leder gebundene Dorfchronik", "Traumkräuter",
        "Das Bleipendel einer fahrenden Priesterin", "1W6 wirklich schmackhafte Pilze",
        "Eine Schubkarre voll Rüben (Wert 2d10 KM)", "Glücksbringer (kann ausgegeben werden, wie ein Glückspunkt)",
        "Kompass eines alten, untergegangenen Schiffes", "Bequeme Stiefel", "Trinkhorn", "Fackel, Feuerstein und Stahl",
        "Pinsel und Farben", "Silberne Ohrringe (Wert 2d4 SM)", "Das Schwert deines Vaters", "Heilkräuter (heilen 1d3 TP)",
        "Goldfischglas ohne Goldfisch", "Ein (oder dein?) Glasauge", "Beutel Kreidestaub", "Faustgroßer Halbedelstein im Wert von 1d6 SM",
        "Trommel", "Seltsame Alraunenwurzel die aussieht wie ein Gnom", "Ein treuer Hund namens Trax", "Gutes Kletterseil",
        "Wegbeschreibung zu einem gutem Gasthaus", "Den schwarzen König eines kostbaren Schachspiels",
        "Skarabäus aus Bronze (Wert 2d6 SM)", "Schlüssel mit einem traurigen Gesicht", "Große Honigwabe eingehüllt in Wachspapier",
        "Rotes Wollknäuel", "Eine Liste mit 1d6 Leuten, die dir was schulden", "Toller Gürtel mit Schnalle", "Graue Perle",
        "Maßband", "Fläschchen Öl", "Sehr gutes Hemd", "Rübe", "Stein, mit einer Silberader", "Der Zahn eines Heiligen"
    ],
    traits: [
        {name: "Größe", values: [["klein", "klein", "klein", "untersetzt", "untersetzt", "untersetzt",
                "mittelgroß", "mittelgroß", "mittelgroß", "mittelgroß", "mittelgroß", "mittelgroß",
                "mittelgroß", "mittelgroß", "mittelgroß", "groß", "groß", "groß",
                "groß", "groß", "groß", "groß", "sehr groß", "sehr groß"]]},
        {name: "Körperfülle", values: [["dürr", "dürr", "schlaksig", "schlaksig", "dünn", "dünn",
                "dünn", "sehnig", "sehnig", "schlank", "schlank", "schlank",
                "schlank", "schlank", "schlank", "kräftig", "kräftig", "kräftig",
                "kräftig", "kräftig", "füllig", "füllig", "massig", "massig"]]},
        {name: "Augenfarbe", values: [["hellgrau", "stahlblau", "tiefblau", "tiefblau", "hellbraun", "hellbraun",
                "hellbraun", "hellbraun", "hellbraun", "hellbraun", "dunkelbraun", "dunkelbraun",
                "dunkelbraun", "dunkelbraun", "dunkelbraun", "dunkelbraun", "dunkelbraun", "dunkelbraun",
                "grau", "schwarz", "bernsteinfarben", "grau-grün", "smaragdgrün", "zweifarbig"]]},
        {name: "Kopfhaar", values: [["lang, zusammengebunden", "lang, zusammengebunden", "lang, zusammengebunden", "lang, zusammengebunden", "Zopf", "lang, lose",
                "lang, lose", "lang, lose", "schulterlang", "schulterlang", "schulterlang", "schulterlang",
                "schulterlang", "schulterlang", "schulterlang", "kurz", "kurz", "kurz",
                "kurz", "kurz", "geschoren", "geschoren", "geschoren", "Glatze"]]},
        {name: "Bart", values: [["keiner", "keiner", "keiner", "keiner", "keiner", "keiner",
                "Dreitagebart", "Dreitagebart", "Dreitagebart", "Dreitagebart", "Dreitagebart", "Schnurrbart, klein",
                "Schnurrbart, klein", "Schnurrbart, klein", "Schnurrbart, klein", "Schnurrbart, klein", "Schnurrbart, groß", "Schnurrbart, groß",
                "Schnurrbart, groß", "Schnurrbart, groß", "Schnurrbart, groß", "Koteletten", "Koteletten", "Ziegenbart",
                "Spitzbart", "gestutzter Vollbart", "gestutzter Vollbart", "gestutzter Vollbart", "gestutzter Vollbart", "wilder Vollbart"]]},
        {name: "Haarfarbe", values: [["schwarz", "schwarz", "schwarz", "schwarz", "schwarz", "dunkelbraun",
                "dunkelbraun", "dunkelbraun", "braun", "braun", "braun", "braun",
                "dunkelblond", "dunkelblond", "dunkelblond", "blond", "blond", "blond",
                "goldblond", "goldblond", "rot", "weiß", "kupferfarben", "silbergrau"]]},
        {name: "Nase", values: [["Stupsnase", "Stupsnase", "Stupsnase", "Stupsnase", "Stupsnase", "normal, unauffällig",
                "normal, unauffällig", "normal, unauffällig", "normal, unauffällig", "normal, unauffällig", "auffällig groß", "auffällig groß",
                "auffällig groß", "auffällig breit", "auffällig breit", "auffällig breit", "auffällig breit", "nach oben gebogen, hochnäsig",
                "nach oben gebogen, hochnäsig", "nach oben gebogen, hochnäsig", "Adlernase (Höcker)", "Adlernase (Höcker)", "Adlernase (Höcker)", "krumm / gebrochen"]]},
        {name: "Kleidung", values: [["geflickt, praktisch", "geflickt, praktisch", "geflickt, praktisch", "geflickt, praktisch", "geflickt, praktisch", "einfaches Leder und Leinen",
                "einfaches Leder und Leinen", "einfaches Leder und Leinen", "einfaches Leder und Leinen", "einfaches Leder und Leinen", "gute Stoffe, bearbeitetes Leder", "gute Stoffe, bearbeitetes Leder",
                "gute Stoffe, bearbeitetes Leder", "gute Stoffe, bearbeitetes Leder", "gute Stoffe, bearbeitetes Leder", "sauber, geschmackvoll", "sauber, geschmackvoll", "sauber, geschmackvoll",
                "sauber, geschmackvoll", "sauber, geschmackvoll", "ausgesucht, teuer", "ausgesucht, teuer", "ausgesucht, teuer", "übertrieben, bunt"]]},
        {name: "Gemüt", values: [["fröhlich", "traurig", "seltsam", "angestrengt", "unbeirrbar", "hoffnungslos",
                "hoffnungsvoll", "besessen", "ahnungslos", "ängstlich", "hingebungsvoll", "angeheitert",
                "aggressiv", "heftig", "vorsichtig", "alarmiert", "scharfzüngig", "ungeschickt",
                "scharfsinnig", "aufrecht", "verstohlen", "geheimnisvoll", "bemüht", "misstrauisch"],
                ["verliebt", "jovial", "erzürnt", "verträumt", "paranoid", "friedfertig",
                    "zufrieden", "gleichgültig", "zuversichtlich", "rachsüchtig", "angeberisch", "draufgängerisch",
                    "böswillig", "gönnerhaft", "weinselig", "unbequem", "gelangweilt", "aufgeweckt",
                    "neugierig", "begriffsstutzig", "ungehobelt", "besserwisserisch", "pessimistisch", "unzufrieden"]]},
    ],
    fate: {
        1: {name: "Strenger Winter", omen: "alle Angriffswürfe"},
        2: {name: "Der Bulle", omen: "Angriffswürfe im Nahkampf"},
        3: {name: "Glückstag", omen: "Angriffswürfe mit Fernkampfwaffen"},
        4: {name: "Von Wölfen aufgezogen", omen: "unbewaffnete Angriffswürfe"},
        5: {name: "Im Sattel gezeugt", omen: "Berittene Angriffswürfe"},
        6: {name: "Geboren auf dem Schlachtfeld", omen: "Schadenswürfe"},
        7: {name: "Pfad des Bären", omen: "Schadenswürfe im Nahkampf"},
        8: {name: "Adlerauge", omen: "Schadenswürfe mit Fernkampfwaffen"},
        9: {name: "Rudeljäger", omen: "Angriffs- und Schadenswürfe für die auf Stufe 0 erlernte Waffe"},
        10: {name: "Geboren unter einem Webstuhl", omen: "Fertigkeitswürfe (inkl. Diebesfertigkeiten)"},
        11: {name: "Listigkeit des Fuchses", omen: "Fallen entdecken/entschärfen"},
        12: {name: "Vierblättriges Kleeblatt", omen: "Geheimtüren entdecken"},
        13: {name: "Siebter Sohn", omen: "Zauberwürfe"},
        14: {name: "Der tobende Sturm", omen: "Zauberschaden"},
        15: {name: "Rechtschaffenes Herz", omen: "Unheiliges-vertreiben-Würfe"},
        16: {name: "Überlebender der Pest", omen: "Magische Heilung (Bei Klerikern wird der Bonus auf alle Heilungen durch den Kleriker angewandt. Bei Nichtklerikern wird der Bonus auf alle magischen Heilungen aus anderen Quellen angewandt)"},
        17: {name: "Glücksbringer", omen: "Rettungswürfe"},
        18: {name: "Schutzengel", omen: "Rettungswürfe, um Fallen zu entkommen"},
        19: {name: "Überlebender eines Spinnenbisses", omen: "Rettungswürfe gegen Gift"},
        20: {name: "Vom Blitz getroffen", omen: "Reflexwürfe"},
        21: {name: "Überlebender einer Hungersnot", omen: "Zähigkeitswürfe"},
        22: {name: "Der Versuchung widerstanden", omen: "Willenskraftwürfe"},
        23: {name: "Verzaubertes Heim", omen: "Rüstungsklasse"},
        24: {name: "Schnelligkeit der Kobra", omen: "Initiative"},
        25: {name: "Reiche Ernte", omen: "Trefferpunkte (gilt für jede Stufe)"},
        26: {name: "Arm des Kriegers", omen: "Kritische Treffertabellen (Glück beeinflusst normalerweise kritische Treffer und Patzer. Bei diesem Ergebnis wird der Modifikator für kritische Treffer und Patzer verdoppelt.)"},
        27: {name: "Unheiliges Heim", omen: "Verderbniswürfe"},
        28: {name: "Der zerbrochene Stern", omen: "Patzer (Glück beeinflusst normalerweise kritische Treffer und Patzer. Bei diesem Ergebnis wird der Modifikator für kritische Treffer und Patzer verdoppelt.)"},
        29: {name: "Vogelgesang", omen: "Anzahl an Sprachen"},
        30: {name: "Wildes Kind", omen: "Bewegungsrate (jedes +1/-1 = +1,5 m/-1,5 m)"},
    },
    kansasFate: {
        1: {name: "Wassermann", omen: "Rüstungsklasse"},
        2: {name: "Fische", omen: "Fertigkeitswürfe (einschließlich Diebesfertigkeiten)"},
        3: {name: "Widder", omen: "Angriffe im Nahkampf"},
        4: {name: "Stier", omen: "Schadenswürfe"},
        5: {name: "Zwillinge", omen: "Initiative"},
        6: {name: "Krebs", omen: "Rettungswürfe auf Willenskraft"},
        7: {name: "Löwe", omen: "Trefferpunkte (jedesmal bei neuer Stufe)"},
        8: {name: "Jungfrau", omen: "Patzer"},
        9: {name: "Waage", omen: "Rettungswürfe auf Zähigkeit"},
        10: {name: "Skorpion", omen: "kritische Treffer"},
        11: {name: "Schütze", omen: "Angriffe im Fernkampf"},
        12: {name: "Steinbock", omen: "Rettungswürfe auf Reflexe"},
    },
};