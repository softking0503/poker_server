'use strict';

module.exports.protectArrayBet = function(table, index, protectedBet) {
    for (var i = 0; i <= index; i++) {
        table[i] = table[i] || 0;
    }
    table[index] = table[index] + protectedBet;
    return table;
};
