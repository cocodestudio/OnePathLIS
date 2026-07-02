<?php

namespace App\Http\Controllers;

use App\Models\Blog;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BlogController extends Controller
{
    public function index()
    {
        $blogs = Blog::orderBy('created_at', 'desc')->get();
        return response()->json(['status' => 'success', 'data' => $blogs], 200);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|string',
            'readTime' => 'required|string',
            'excerpt' => 'required|string',
            'content' => 'required|string',
            'featured' => 'boolean'
        ]);

        $blog = Blog::create([
            'title' => $request->title,
            'slug' => Str::slug($request->title) . '-' . time(), 
            'category' => $request->category,
            'read_time' => $request->readTime, 
            'excerpt' => $request->excerpt,
            'content' => $request->content,
            'featured' => $request->featured ?? false,
        ]);

        return response()->json([
            'status' => 'success', 
            'message' => 'Blog created successfully',
            'data' => $blog
        ], 201);
    }
    
    public function getPublicBlogs()
    {
        $blogs = Blog::where('status', 'published')
                     ->orderBy('created_at', 'desc')
                     ->get();
        return response()->json($blogs, 200);
    }
}