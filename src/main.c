#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <sys/types.h>
#include <sys/stat.h>
#include "raylib.h"
#include "rlgl.h"


#define GLSL_VERSION 330

time_t GetFileModificationTime(const char *fileName);

int main(void)
{
    const int screen_width = 500;
    const int screen_height = 500;

    InitWindow(screen_width, screen_height, "RLFS");

    // Load the shader
    const char *frag_shader_fn = "assets/shader.frag";
    Shader shader = LoadShader(0, TextFormat(frag_shader_fn, GLSL_VERSION));

    // Load texture from file
    const char *skybox_fn = "assets/skybox.png";
    Texture2D skybox = LoadTexture(skybox_fn);

    // Get shader locations for required uniforms
    int resolution_loc = GetShaderLocation(shader, "resolution");
    int mouse_loc = GetShaderLocation(shader, "mouse");
    int time_loc = GetShaderLocation(shader, "seconds");

    float resolution[2] = { (float)screen_width, (float)screen_height };
    SetShaderValue(shader, resolution_loc, resolution, SHADER_UNIFORM_VEC2);

    float seconds = 0.0f;

    time_t last_mod_time = GetFileModificationTime(frag_shader_fn);

    SetTargetFPS(60);

    uint32_t frame = 0;
    while (!WindowShouldClose())
    {   frame++;
        seconds += GetFrameTime();

        // Print frame time
        if (frame % 512 == 0) {
            printf("Avg Frame Time: %.2f ms\n", seconds * 1000 / frame);
        }

        Vector2 mouse = GetMousePosition();
        float mousePos[2] = { mouse.x, mouse.y };

        // Check if the shader file has been modified
        time_t current_mod_time = GetFileModificationTime(frag_shader_fn);
        if (current_mod_time != last_mod_time) {
            last_mod_time = current_mod_time;

            // Unload the previous shader and load the new one
            UnloadShader(shader);
            shader = LoadShader(0, TextFormat(frag_shader_fn, GLSL_VERSION));

            // Update uniform locations
            resolution_loc = GetShaderLocation(shader, "resolution");
            mouse_loc = GetShaderLocation(shader, "mouse");
            time_loc = GetShaderLocation(shader, "seconds");

            // Set shader resolution
            SetShaderValue(shader, resolution_loc, resolution, SHADER_UNIFORM_VEC2);
        }

        // Set shader required uniform values
        SetShaderValue(shader, time_loc, &seconds, SHADER_UNIFORM_FLOAT);
        SetShaderValue(shader, mouse_loc, mousePos, SHADER_UNIFORM_VEC2);

        // Draw frame
        BeginDrawing();
        BeginShaderMode(shader);
        DrawTexture(skybox, 0, 0, WHITE);
        EndShaderMode();
        EndDrawing();
    }
    
    // Unload assets
    UnloadShader(shader);
    UnloadTexture(skybox);
    CloseWindow();
    return 0;
}


// Function to get the last modification time of a file
time_t GetFileModificationTime(const char *fileName) {
    struct stat fileStat;
    if (stat(fileName, &fileStat) == 0) {
        return fileStat.st_mtime;
    }
    return 0;
}