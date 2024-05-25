#version 330 core

out vec4 finalColor;

uniform vec2 resolution;
uniform vec2 mouse;
uniform float time;

#define PI 3.14159265359

struct Ray {
    vec3 origin;
    vec3 direction;
};

struct Camera {
    vec3 position;
    vec3 direction;
};

struct Sphere {
    vec3 center;
    float radius;
    vec3 color;
};


const vec3 bg_color = vec3(0.0, 0.2, 0.2);
const Camera camera = Camera(vec3(0.0, 0.0, -1.6), vec3(0.0, 0.0, 1.0));
const Sphere sphere = Sphere(vec3(0.0, 0.0, 0.0), 1.0, vec3(1.0, 0.8, 0.2));
const float gamma = 1.0 / 1.6;

vec3 ray_march(Ray ray);
vec3 get_normal(vec3 point);
float map_the_world(vec3 point);
float get_distance_from_sphere(vec3 point, vec3 center, float radius);
vec3 get_color(vec3 ray_dir, vec3 point);
vec3 apply_gamma(vec3 color);


void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy - 1.0;
    vec2 mouse_uv = 2.0 * mouse.xy / resolution.xy - 1.0;
    mouse_uv.y *= -1;
    
    Ray ray = Ray(camera.position, normalize(vec3(uv, 1.0)));    

    vec3 color = ray_march(ray);

    color = apply_gamma(color);

    finalColor = vec4(color, 0.8);
}


vec3 apply_gamma(vec3 color) {
    return vec3(pow(color.x, gamma), pow(color.y, gamma), pow(color.z, gamma));
}

vec3 get_color(vec3 ray_dir, vec3 point) {
    vec3 norm = get_normal(point - sphere.center);
    float b = dot(-norm, ray_dir);
    vec3 c = sphere.color;
    return vec3(c.x * b, c.y * pow(b, 3.0), c.z * (0.5-b*0.5));
}

float get_distance_from_sphere(vec3 point, vec3 center, float radius) {
    return length(point - center) - radius;
}

vec3 get_normal(vec3 point) {
    const vec3 small_step = vec3(0.01, 0.0, 0.0);
    float g_x = map_the_world(point + small_step.xyy) - map_the_world(point - small_step.xyy);
    float g_y = map_the_world(point + small_step.yxy) - map_the_world(point - small_step.yxy);
    float g_z = map_the_world(point + small_step.yyx) - map_the_world(point - small_step.yyx);
    return normalize(vec3(g_x, g_y, g_z));
}

float map_the_world(vec3 point) {
    float mod_time = mod(time, 2*PI);
    float dis = get_distance_from_sphere(point, sphere.center, sphere.radius);
    
    float displacement = sin(7.0 * point.x) * sin(11.0 * point.y) * sin(17.0 * point.z - 5.0 * mod_time);
    displacement *= 0.05 + sin(mod_time * 2.0) * 0.03;

    return dis + displacement;
}

vec3 ray_march(in Ray ray) {
    float dis_traveled = 0.0;
    const int NUM_OF_STEPS = 100;
    const float MIN_HIT_DIS = 0.001;
    const float MAX_TRACE_DIS = 100.0;

    for (int i = 0; i < NUM_OF_STEPS; i++) {
        vec3 pos = ray.origin + dis_traveled * ray.direction;
        float dis_to_closest = map_the_world(pos);

        if (dis_to_closest < MIN_HIT_DIS) {
            return get_color(ray.direction, pos);
        }

        if (dis_traveled > MAX_TRACE_DIS) {
            break;
        }

        dis_traveled += dis_to_closest;
    }
    return bg_color;
}