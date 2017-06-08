#include "json.h"
#include <stdio.h>

void json_str(FILE *f, const char *str)
{
	int start, i;
	char c;

	fprintf(f, "\"");

	start = 0;
	i = 0;
	while (1)
	{
		c = str[i];
		if (c == '\0')
		{
			fwrite(str + start, 1, i - start, f);
			break;
		}
		else if (c == '\\' || c == '\"')
		{
			fwrite(str + start, 1, i - start, f);
			fprintf(f, "\\%c", str[i]);
			start = i + 1;
		}

		i += 1;
	}

	fprintf(f, "\"");
}
void json_sep(FILE *f)
{
	fprintf(f, ",");
}

void json_obj_start(FILE *f)
{
	fprintf(f, "{");
}
void json_obj_key(FILE *f, const char *key)
{
	json_str(f, key);
	fprintf(f, ":");
}
void json_obj_end(FILE *f)
{
	fprintf(f, "}");
}

void json_arr_start(FILE *f)
{
	fprintf(f, "[");
}
void json_arr_end(FILE *f)
{
	fprintf(f, "]");
}
