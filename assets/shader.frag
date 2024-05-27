#version 330 core

out vec4 finalColor;

uniform vec2 resolution;
uniform vec2 mouse;
uniform float seconds;
uniform sampler2D skybox;

#define PI 3.14159265359

struct Ray {
    vec3 ori;
    vec3 dir;
};

struct Camera {
    vec3 pos;
    float rotation;
    float gamma;
};

struct Sphere {
    vec3 pos;
    float rad;
    vec3 color;
    float shininess;
};


struct Light {
    vec3 pos;
    vec3 color;
};

const int NUM_OF_STEPS = 1000;
const float MIN_HIT_DIS = 0.0001;
const float MAX_TRACE_DIS = 10.0;

const Camera camera = Camera(vec3(0.0, 0.0, -1.6), 0.0, 1.0/1.6);

const Sphere sphere = Sphere(vec3(0.0, 0.0, 0.0), 1.0, vec3(1.0, 1.0, 1.0), 1.0);

const bool COLOR_EFFECTS = false;

const Light light_1 = Light(vec3(-5.0, 5.0, -2.0), vec3(1.0, 1.0, 1.0));
const Light light_2 = Light(vec3(3.0, -2.0, -2.0), vec3(0.0, 0.0, 1.0));

const int light_count = 2;
const Light lights[light_count] = Light[light_count](light_1, light_2);

// Functions declarations
vec4 RayMarch(Ray ray);
float GetDistance(vec3 point);
vec3 GetNormal(vec3 point);
vec3 SampleColor(vec3 point, vec3 dir);
vec3 SampleSkybox(vec3 dir);
vec3 ApplyGamma(vec3 color);


// Main function
void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy - 1.0;
    vec2 mouse_uv = 2.0 * mouse.xy / resolution.xy - 1.0;
    mouse_uv.y *= -1;
    
    float phi = camera.rotation;
    float alp = 0;
    Ray ray = Ray(camera.pos, normalize(vec3(uv, 1.0)));
    ray.dir *= mat3(cos(phi), 0, -sin(phi), 0, 1, 0, sin(phi), 0, cos(phi));
    ray.dir *= mat3(1, 0, 0, 0, cos(alp), sin(alp), 0, -sin(alp), cos(alp));

    ray.dir = normalize(ray.dir);
    finalColor = RayMarch(ray);
}


// Gets distance between given point and the sphere center adding some displacement
float GetDistance(vec3 point) {
    float d_time = mod(seconds, 2*PI);
    float dis = length(point - sphere.pos) - sphere.rad;
    
    float diff = sin(7.0 * point.x) * sin(11.0 * point.y) * sin(17.0 * point.z - 5.0 * d_time);
    diff *= 0.05 + sin(d_time * 2.0) * 0.03;

    return dis + diff;
}

// Approximate the normal vector for a given point on the sphere surface
vec3 GetNormal(vec3 point) {
    const vec3 step = vec3(0.01, 0.0, 0.0);
    float x = GetDistance(point + step.xyy) - GetDistance(point - step.xyy);
    float y = GetDistance(point + step.yxy) - GetDistance(point - step.yxy);
    float z = GetDistance(point + step.yyx) - GetDistance(point - step.yyx);
    return normalize(vec3(x, y, z));
}

// Determines color of the sphere in a given point
vec3 SampleColor(vec3 point, vec3 dir) {
    vec3 norm = GetNormal(point);
    float brightness = dot(norm, -dir);
    vec3 color = sphere.color;

    // Color blending effects
    if (COLOR_EFFECTS) {
        float d_t = mod(seconds, 2.0*PI);
        color.r *= max(sin(d_t), sin(d_t - 3.0 * PI / 2.0));
        color.g *= max(sin(d_t - PI / 2.0), 0.0);
        color.b *= max(sin(d_t - PI), 0.0);
        // color.r *= brightness;
        // color.g *= pow(brightness, 2.5);
        // color.b *= (0.5 - 0.5 * brightness);
    }
    else {
        color *= brightness;
    }
    
    // Light sources influence
    for (int i = 0; i < 2; i++) {
        vec3 halfway_dir = normalize(normalize(lights[i].pos - point) - dir);
        color += lights[i].color * pow(max(dot(norm, halfway_dir), 0.0), 32.0);
    }

    // Specular reflection
    vec3 spec_dir = dir - norm * dot(dir, norm) * 2.0;
    vec3 spec_color = SampleSkybox(spec_dir);
    
    // Blend colors
    color = color + (spec_color - color) * sphere.shininess;

    color = ApplyGamma(color);
    return color;
}

// Applys gamma correction to the given color
vec3 ApplyGamma(vec3 color) {
    return vec3(pow(color.r, camera.gamma), pow(color.g, camera.gamma), pow(color.b, camera.gamma));
}

// Samples skybox based on the ray direction
vec3 SampleSkybox(vec3 dir) {
    float u = 0.5 - atan(dir.z, dir.x) / (2.0 * PI);
    float v = 0.5 - asin(dir.y) / PI;
    return texture(skybox, vec2(u, v)).rgb;
}

// Petforms ray marching and return color as vec4
vec4 RayMarch(Ray ray) {
    float total_traveled = 0.0;

    for (int i = 0; i < NUM_OF_STEPS; i++) {
        vec3 pos = ray.dir * total_traveled + ray.ori;
        float dis = GetDistance(pos);

        if (dis < MIN_HIT_DIS) {
            vec3 color = SampleColor(pos, ray.dir);
            return vec4(color, 1.0);
        }

        if (total_traveled > MAX_TRACE_DIS) {
            break;
        }

        total_traveled += dis;
    }
    return vec4(ApplyGamma(SampleSkybox(ray.dir)), 1.0);
}