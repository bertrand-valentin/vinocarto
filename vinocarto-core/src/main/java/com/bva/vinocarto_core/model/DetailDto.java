package com.bva.vinocarto_core.model;

public class DetailDto {

    private Long id;
    private String region;
    private String country;
    private String type;
    private String appellation;
    private boolean mapReady;

    public DetailDto(Long id, String region, String country, String type, String appellation, boolean mapReady) {
        this.id = id;
        this.region = region;
        this.country = country;
        this.type = type;
        this.appellation = appellation;
        this.mapReady = mapReady;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public boolean isMapReady() {
        return mapReady;
    }

    public void setMapReady(boolean mapReady) {
        this.mapReady = mapReady;
    }

    @Override
    public String toString() {
        final StringBuilder sb = new StringBuilder("DetailDto{");
        sb.append("id=").append(id);
        sb.append(", region='").append(region).append('\'');
        sb.append(", country='").append(country).append('\'');
        sb.append(", type='").append(type).append('\'');
        sb.append(", appellation='").append(appellation).append('\'');
        sb.append(", mapReady=").append(mapReady);
        sb.append('}');
        return sb.toString();
    }

    public String getAppellation() {
        return appellation;
    }

    public void setAppellation(String appellation) {
        this.appellation = appellation;
    }
}
