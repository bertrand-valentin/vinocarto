package com.bva.vinocarto_core.model;

public class RegionDto {

    private Long id;
    private String name;
    private String countryName;

    public RegionDto(Long id, String name, String countryName) {
        this.id = id;
        this.name = name;
        this.countryName = countryName;
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

    public String getCountryName() {
        return countryName;
    }

    public void setCountryName(String countryName) {
        this.countryName = countryName;
    }

    @Override
    public String toString() {
        final StringBuilder sb = new StringBuilder("Region{");
        sb.append("id=").append(id);
        sb.append(", name='").append(name).append('\'');
        sb.append(", countryName=").append(countryName);
        sb.append('}');
        return sb.toString();
    }
}
