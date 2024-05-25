# Compiler and linker
CC = gcc

# Compiler flags
CFLAGS = -Wall -std=c99 -O2

# Include and library paths
INCLUDES = $(shell pkg-config --cflags raylib)
LIBS = $(shell pkg-config --libs raylib)

# Executable name
TARGET = RLFS

# Source files
SRCS = main.c

# Object files
OBJS = ./src/$(SRCS:.c=.o)

# Default target
all: $(TARGET)

# Link the executable
$(TARGET): $(OBJS)
	$(CC) -o $(TARGET) $(OBJS) $(LIBS)

# Compile source files into object files
%.o: %.c
	$(CC) $(CFLAGS) $(INCLUDES) -c $< -o $@

# Clean up build files
clean:
	rm -f $(OBJS) $(TARGET)

# Run the program
run: $(TARGET)
	rm -f $(OBJS)
	./$(TARGET)

# PHONY targets
.PHONY: all clean run