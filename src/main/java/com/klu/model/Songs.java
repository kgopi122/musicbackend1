package com.klu.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "songs")
public class Songs {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    Long id;

    @Column(name = "title")
    String title;

    @Column(name = "artist")
    String artist;

    @Column(name = "singer")
    String singer;

    @Column(name = "genre")
    String genre;

    @Column(name = "movie_name")
    String movieName;

    @Column(name = "year")
    Integer year;

    @Column(name = "duration")
    String duration;

    @Column(name = "language")
    String language;

    @Column(name = "category")
    String category;

    @Column(name = "lyrics")
    String lyrics;

    @Column(name = "image_url")
    String imageUrl;

    @Column(name = "artist_image_url")
    String artistImageUrl;

    @Column(name = "audio_url")
    String audioUrl;

    @Column(name = "is_favorite")
    Boolean isFavorite = false;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getArtist() { return artist; }
    public void setArtist(String artist) { this.artist = artist; }
    public String getSinger() { return singer; }
    public void setSinger(String singer) { this.singer = singer; }
    public String getGenre() { return genre; }
    public void setGenre(String genre) { this.genre = genre; }
    public String getMovieName() { return movieName; }
    public void setMovieName(String movieName) { this.movieName = movieName; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getLyrics() { return lyrics; }
    public void setLyrics(String lyrics) { this.lyrics = lyrics; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getArtistImageUrl() { return artistImageUrl; }
    public void setArtistImageUrl(String artistImageUrl) { this.artistImageUrl = artistImageUrl; }
    public String getAudioUrl() { return audioUrl; }
    public void setAudioUrl(String audioUrl) { this.audioUrl = audioUrl; }
    public Boolean getIsFavorite() { return isFavorite; }
    public void setIsFavorite(Boolean isFavorite) { this.isFavorite = isFavorite; }
}
