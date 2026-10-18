#include <stdio.h>
#include <string.h>
#include "io.h"

void ask_line(char* buf, int size) {
    if (fgets(buf, size, stdin)) {
        buf[strcspn(buf, "\r\n")] = '\0';
    } else {
        buf[0] = '\0';
    }
}

int ask_int(const char* prompt, int lo, int hi) {
    char line[64];
    int v;
    while (1) {
        printf("%s", prompt);
        if (!fgets(line, sizeof line, stdin)) return lo;
        if (sscanf(line, "%d", &v) == 1 && v >= lo && v <= hi) return v;
        printf("Please enter a number from %d to %d.\n", lo, hi);
    }
}