package com.bva.vinocarto_core.model;

public class AppellationDto {

    private Long id;
    private String name;
    private String region;
    private String colour;

    public AppellationDto(Long id, String name, String region, String colour) {
        this.id = id;
        this.name = name;
        this.region = region;
        this.colour = colour;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public String getColour() {
        return colour;
    }

    public void setColour(String colour) {
        this.colour = colour;
    }

    @Override
    public String toString() {
        final StringBuilder sb = new StringBuilder("Appellation{");
        sb.append("id=").append(id);
        sb.append(", name='").append(name).append('\'');
        sb.append(", region=").append(region);
        sb.append(", colour=").append(colour);
        sb.append('}');
        return sb.toString();
    }
}
