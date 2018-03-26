TARGET=udev-monitor

SRC=src/main.c src/json.c
HDR=src/json.h

$(TARGET): $(SRC) $(HDR)
	$(CC) -o $(TARGET) -g $(SRC) $(shell pkg-config --cflags --libs libudev)
	chmod +x $(TARGET)

clean:
	rm -f $(TARGET)
