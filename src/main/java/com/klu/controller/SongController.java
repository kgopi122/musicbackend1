package com.klu.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.klu.model.Songs;
import com.klu.repository.SongRepository;

@RestController
@RequestMapping("/api/songs")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"})
public class SongController {

    private final SongRepository songRepository;

    public SongController(SongRepository songRepository) {
        this.songRepository = songRepository;
    }

    @GetMapping
    public List<Songs> getAllSongs() {
        return songRepository.findAll();
    }

    @GetMapping("/genre/{genre}")
    public List<Songs> getSongsByGenre(@PathVariable String genre) {
        return songRepository.findByGenre(genre);
    }

    @GetMapping("/artist/{artist}")
    public List<Songs> getSongsByArtist(@PathVariable String artist) {
        return songRepository.findByArtist(artist);
    }

    @GetMapping("/movie/{movieName}")
    public List<Songs> getSongsByMovie(@PathVariable String movieName) {
        return songRepository.findByMovieName(movieName);
    }

    @PostMapping 
    public Songs addSong(@RequestBody Songs song) {
        return songRepository.save(song);
    }
}
