#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

// Gera um caractere hexadecimal aleatório (0-9, A-F)
char gerarHex() {
    int val = rand() % 16;
    if (val < 10) return '0' + val;
    return 'A' + (val - 10);
}

// Converte caractere hexadecimal em valor 0-15
int hexToInt(char c) {
    if (c >= '0' && c <= '9') return c - '0';
    if (c >= 'A' && c <= 'F') return c - 'A' + 10;
    if (c >= 'a' && c <= 'f') return c - 'a' + 10;
    return -1;
}

// Calcula o checksum para o código (soma dos valores exceto checksum) % 16
char calcularChecksum(char *codigoSemChecksum) {
    // Código sem MBS- e sem o caractere checksum
    // A entrada deve ter 12 caracteres hex (4+4+4)
    int soma = 0;
    for (int i = 0; i < 12; i++) {
        soma += hexToInt(codigoSemChecksum[i]);
    }
    int cs = soma % 16;
    if (cs < 10) return '0' + cs;
    return 'A' + (cs - 10);
}

int main() {
    srand((unsigned int)time(NULL));

    char codigo[20]; // Formato: MBS-XXXX-XXXX-XXXX (19 chars + \0)
    char bloco1[5];
    char bloco2[5];
    char bloco3[5];

    // Gerar os primeiros 12 hexadecimais (4 + 4 + 4)
    for (int i = 0; i < 4; i++) bloco1[i] = gerarHex();
    bloco1[4] = '\0';
    for (int i = 0; i < 4; i++) bloco2[i] = gerarHex();
    bloco2[4] = '\0';
    for (int i = 0; i < 4; i++) bloco3[i] = gerarHex();
    bloco3[4] = '\0';

    // Montar string sem checksum (12 chars concatenados)
    char codigoSemChecksum[13];
    snprintf(codigoSemChecksum, sizeof(codigoSemChecksum), "%s%s%s", bloco1, bloco2, bloco3);

    // Calcular checksum
    char checksum = calcularChecksum(codigoSemChecksum);

    // Inserir checksum na penúltima posição do código final (posição 16 no string total)
    // Conforme seu JS: penúltimo caractere do código (antes do último bloco) é checksum
    // Para isso, substituiremos o penúltimo caractere do terceiro bloco (bloco3[2]) pelo checksum
    // Ou seja: MBS-XXXX-XXXX-XXCS (C é checksum, S é o último char random)
    bloco3[2] = checksum;

    // Regerar o último caractere (posição 15) do código
    bloco3[3] = gerarHex();

    // Montar código final
    snprintf(codigo, sizeof(codigo), "MBS-%s-%s-%s", bloco1, bloco2, bloco3);

    printf("Código de ativação gerado:\n%s\n", codigo);

    return 0;
}
