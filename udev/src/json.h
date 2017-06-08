#ifndef JSON_H
#define JSON_H

#include <stdio.h>

void json_str(FILE *f, const char *str);
void json_sep(FILE *f);

void json_obj_start(FILE *f);
void json_obj_key(FILE *f, const char *key);
void json_obj_end(FILE *f);

void json_arr_start(FILE *f);
void json_arr_end(FILE *f);

#endif
