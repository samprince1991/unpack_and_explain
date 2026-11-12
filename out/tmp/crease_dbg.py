import bpy, bmesh, math, sys
args = sys.argv[sys.argv.index("--")+1:]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=args[0])
for o in bpy.context.scene.objects:
    if o.type != "MESH" or o.name not in args[1:]: continue
    bm = bmesh.new(); bm.from_mesh(o.data); bm.normal_update()
    for e in bm.edges:
        f = e.link_faces
        if len(f) != 2 or f[0].calc_area() < 1e-8 or f[1].calc_area() < 1e-8: continue
        a = math.degrees(f[0].normal.angle(f[1].normal, 0))
        if 28 <= a < 80:
            m = (e.verts[0].co + e.verts[1].co)/2
            print(f"DBG {o.name} {a:.0f} at {m.x:.3f} {-m.z:.3f} {m.y:.3f}")
